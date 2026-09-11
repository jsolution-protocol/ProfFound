// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

contract ProfFound {

    enum Status {
        Active,
        Successful,
        Failed,
        Withdrawn
    }

    struct Project {
        address payable creator;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 raised;
        Status status;
    }

}
