#!/bin/bash

valid_contracts=("xcall")
valid_chains=("ethereum" "avalanche" "binance" "arbitrum" "optimism" "base" "sepolia" "arbitrum_sepolia" "base_sepolia" "binance_testnet" "fuji" "optimism_sepolia")

show_help() {
  echo "Usage: $0 <command> [parameters]"
  echo
  echo "Commands:"
  echo "  create-proposal --chain <chain> upgrade <contract> --impl <new-impl-address> --remark <remark>"
  echo "  create-proposal --chain <chain> member-manage <add|remove> --address <address> --threshold <threshold> --remark <remark>"
  echo "  approve-proposal --chain <chain> --proposal-hash <proposal_hash> --private-key <private-key>"
  echo "  execute-proposal --chain <chain> --proposal-hash <proposal_hash> --private-key <private-key>"
  echo "  deploy-safe --chain <chain> <private-key>"
  echo "  setup-safe --chain <chain> --members <member1,member2,...> --threshold <threshold>"
  echo
  echo "Examples:"
  echo "  $0 create-proposal --chain mainnet upgrade xcall --impl 0x1234567890abcdef --remark 'Upgrade to new implementation'"
  echo "  $0 create-proposal --chain mainnet member-manage add --address 0xabcdef123456 --threshold 2 --remark 'Add new member'"
  echo "  $0 approve-proposal --chain mainnet --proposal-hash 0xproposalhash --private-key 0xprivatekey"
  echo "  $0 execute-proposal --chain mainnet --proposal-hash 0xproposalhash --private-key 0xprivatekey"
  echo "  $0 deploy-safe --chain mainnet 0xprivatekey"
  echo "  $0 setup-safe --chain mainnet --members 0xmember1,0xmember2 --threshold 2"

  echo "Valid chains:"
  for chain in "${valid_chains[@]}"; do
    echo "  $chain"
  done

  echo "Valid contracts:"
  for contract in "${valid_contracts[@]}"; do
    echo "  $contract"
  done
}

contains() {
  local n=$#
  local value=${!n}
  for ((i=1; i < $#; i++)); do
    if [ "${!i}" == "${value}" ]; then
      return 0
    fi
  done
  return 1
}

create_proposal() {
  local chain=""
  local action=""
  local contract=""
  local impl=""
  local address=""
  local threshold=""
  local remark=""
  local mode=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --chain)
        chain="$2"
        shift 2
        ;;
      upgrade)
        action="upgrade"
        contract="$2"
        shift 2
        ;;
      member-manage)
        action="member-manage"
        mode="$2"
        shift 2
        ;;
      --impl)
        impl="$2"
        shift 2
        ;;
      --address)
        address="$2"
        shift 2
        ;;
      --threshold)
        threshold="$2"
        shift 2
        ;;
      --remark)
        remark="$2"
        shift 2
        ;;
      *)
        show_help
        exit 1
        ;;
    esac
  done

  if [[ -z "$chain" ]] || ! contains "${valid_chains[@]}" "$chain"; then
    show_help
    exit 1
  fi

  case "$action" in
    upgrade)
      if [[ -z "$contract" ]] || ! contains "${valid_contracts[@]}" "$contract"; then
        show_help
        exit 1
      fi
      if [[ -z "$impl" ]] || [[ -z "$remark" ]]; then
        show_help
        exit 1
      fi
      echo "Creating upgrade proposal for contract $contract with new implementation $impl on chain $chain..."
      node scripts/upgrade_proposal.js --chain "$chain" --contract "$contract" --new-impl "$impl" --remark "$remark"
      ;;
    member-manage)
      if [[ "$mode" != "add" && "$mode" != "remove" ]] || [[ -z "$address" ]] || [[ -z "$threshold" ]] || [[ -z "$remark" ]]; then
        show_help
        exit 1
      fi

      case "$mode" in
        add)
          mode="add"

          echo "Creating member management proposal to add member with address $address and threshold $threshold on chain $chain..."
          node scripts/propose_member_add.js --chain "$chain" --address "$address" --threshold "$threshold" --remark "$remark"
          ;;
        remove)
          mode="remove"

          echo "Creating member management proposal to remove member with address $address on chain $chain..."
          node scripts/propose_member_remove.js --chain "$chain" --address "$address" --threshold "$threshold" --remark "$remark"
          ;;
        *)
          show_help
          exit 1
          ;;
      esac
      ;;
    *)
      show_help
      exit 1
      ;;
  esac
}

# Function to approve a proposal
approve_proposal() {
  local chain=""
  local proposal_hash=""
  local private_key=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --chain)
        chain="$2"
        shift 2
        ;;
      --proposal-hash)
        proposal_hash="$2"
        shift 2
        ;;
      --private-key)
        private_key="$2"
        shift 2
        ;;
      *)
        show_help
        exit 1
        ;;
    esac
  done

  if [[ -z "$chain" ]] || ! contains "${valid_chains[@]}" "$chain" || [[ -z "$proposal_hash" ]] || [[ -z "$private_key" ]]; then
    show_help
    exit 1
  fi

  echo "Approving proposal with hash $proposal_hash using private key on chain $chain..."
  node scripts/approve_proposal.js --chain "$chain" --proposal-hash "$proposal_hash" --private-key "$private_key"
}

# Function to execute a proposal
execute_proposal() {
  local chain=""
  local proposal_hash=""
  local private_key=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --chain)
        chain="$2"
        shift 2
        ;;
      --proposal-hash)
        proposal_hash="$2"
        shift 2
        ;;
      --private-key)
        private_key="$2"
        shift 2
        ;;
      *)
        show_help
        exit 1
        ;;
    esac
  done

  if [[ -z "$chain" ]] || ! contains "${valid_chains[@]}" "$chain" || [[ -z "$proposal_hash" ]] || [[ -z "$private_key" ]]; then
    show_help
    exit 1
  fi

  echo "Executing proposal with hash $proposal_hash using private key on chain $chain..."
  # Add the command to execute the proposal here
  node scripts/execute_proposal.js --chain $chain --proposal-hash $proposal_hash --private-key $private_key
}

# Function to deploy a safe
deploy_safe() {
  local chain=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --chain)
        chain="$2"
        shift 2
        ;;
      *)
    esac
  done

  if [[ -z "$chain" ]] || ! contains "${valid_chains[@]}" "$chain"; then
    show_help
    exit 1
  fi

  echo "Deploying safe using private key on chain $chain..."
  npx hardhat run scripts/deploy.js --network "$chain"
  echo "Safe deployed on chain $chain."
}

setup_safe() {
  local chain=""
  local members=""
  local threshold=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --chain)
        chain="$2"
        shift 2
        ;;
      --members)
        members="$2"
        shift 2
        ;;
      --threshold)
        threshold="$2"
        shift 2
        ;;
      *)
        show_help
        exit 1
        ;;
    esac
  done

  if [[ -z "$chain" ]] || ! contains "${valid_chains[@]}" "$chain" || [[ -z "$members" ]] || [[ -z "$threshold" ]]; then
    show_help
    exit 1
  fi

  echo "Setting up safe with members and threshold on chain $chain..."
  node scripts/setup.js "$chain" "$members" "$threshold"
}

main() {
  if [[ $# -eq 0 ]]; then
    show_help
    exit 1
  fi

  case "$1" in
    create-proposal)
      shift
      create_proposal "$@"
      ;;
    approve-proposal)
      shift
      approve_proposal "$@"
      ;;
    execute-proposal)
      shift
      execute_proposal "$@"
      ;;
    deploy-safe)
      shift
      deploy_safe "$@"
      ;;
    setup-safe)
      shift
      setup_safe "$@"
      ;;
    *)
      show_help
      exit 1
      ;;
  esac
}

# Run the main function with all passed arguments
main "$@"
