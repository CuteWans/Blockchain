// Please paste your contract's solidity code here
// Note that writing a contract here WILL NOT deploy it and allow you to access it from your client
// You should write and develop your contract in Remix and then, before submitting, copy and paste it here
// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract IOUmodel {
    //建立一个二维的欠账图
    mapping(address => mapping(address => uint32)) IOUgraph;

    modifier checkOwn(address creditor, uint32 amount) {
        require(creditor != msg.sender);
        require(amount > 0);
        _;
    }

    //用来查询欠账图中的数据
    function lookup(address debtor, address creditor)
        public
        view
        returns (uint32 ret)
    {
        return IOUgraph[debtor][creditor];
    }

    //添加一条欠账信息
    function add_IOU(address creditor, uint32 amount)
        public
        checkOwn(creditor, amount)
    {
        IOUgraph[msg.sender][creditor] += amount;
    }

    //处理一条欠账信息
    function clear_IOU(
        address debtor,
        address creditor,
        uint32 amount
    ) public {
        require(amount > 0);
        IOUgraph[debtor][creditor] -= amount;
    }
}