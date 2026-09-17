// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ProfFound} from "../src/ProfFound.sol";

/**
 * @title DeployProfFound
 * @notice Deployment script for ProfFound smart contract.
 * @dev Run with:
 *      forge script script/DeployProfFound.s.sol:DeployProfFound --rpc-url <RPC_URL> --broadcast --verify
 */
contract DeployProfFound is Script {
    function setUp() public {}

    function run() public returns (ProfFound profFound) {
        // Mengambil private key dari environment variable jika ada, atau menggunakan default broadcaster
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));

        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast();
        }

        profFound = new ProfFound();

        vm.stopBroadcast();

        console.log("ProfFound deployed at:", address(profFound));
    }
}
