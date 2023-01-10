// =============================================================================
//                                  Config 
// =============================================================================

// sets up web3.js
if (typeof web3 !== 'undefined')  {
	web3 = new Web3(web3.currentProvider);
} else {
	web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

// Default account is the first one
web3.eth.defaultAccount = web3.eth.accounts[0];
// Constant we use later
var GENESIS = '0x0000000000000000000000000000000000000000000000000000000000000000';

// This is the ABI for your contract (get it from Remix, in the 'Compile' tab)
// ============================================================
var abi = [

	{
		"inputs": [
			{
				"internalType": "address",
				"name": "creditor",
				"type": "address"
			},
			{
				"internalType": "uint32",
				"name": "amount",
				"type": "uint32"
			}
		],
		"name": "add_IOU",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "debtor",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "creditor",
				"type": "address"
			},
			{
				"internalType": "uint32",
				"name": "amount",
				"type": "uint32"
			}
		],
		"name": "clear_IOU",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "debtor",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "creditor",
				"type": "address"
			}
		],
		"name": "lookup",
		"outputs": [
			{
				"internalType": "uint32",
				"name": "ret",
				"type": "uint32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
	
]; // FIXME: fill this in with your contract's ABI
// ============================================================
abiDecoder.addABI(abi);
// call abiDecoder.decodeMethod to use this - see 'getAllFunctionCalls' for more

// Reads in the ABI
var BlockchainSplitwiseContractSpec = web3.eth.contract(abi);

// This is the address of the contract you want to connect to; copy this from Remix
var contractAddress = '0x2996e516363Eaef87B2426226A00C7B2CbB2252D'.toLowerCase()  // FIXME: fill this in with your contract's address/hash

var BlockchainSplitwise = BlockchainSplitwiseContractSpec.at(contractAddress)


// =============================================================================
//                            Functions To Implement 
// =============================================================================

// TODO: Add any helper functions here!

// TODO: Return a list of all users (creditors or debtors) in the system
// You can return either:
//   - a list of everyone who has ever sent or received an IOU
// OR
//   - a list of everyone currently owing or being owed money
function getUsers() {
	let all_users = [];
	let userset = new Set();
	let current = web3.eth.blockNumber;
    while(current != GENESIS) {
		let now = web3.eth.getBlock(current, true);
		let alls = now.transactions;
		for(let i = 0; i < alls.length; i ++) {
			let it = alls[i];
			if(it.to === contractAddress) {
				let f = abiDecoder.decodeMethod(it.input);
				if(f && f.name === "add_IOU") {
					let args = f.params.map(function(x) {return x.value;});
					userset.add(it.from);
					userset.add(args[0]);
				}
			}
		}
		current = now.parentHash;
	}
	for(let it of userset)	all_users.push(it);
    return all_users;
}

// TODO: Get the total amount owed by the user specified by 'user'
function getTotalOwed(user) {
	let OwnerList = getUsers();
	let total = 0;
	for (let owner of OwnerList)
    	total += BlockchainSplitwise.lookup.call(user, owner).toNumber();
    return total;
}

// TODO: Get the last time this user has sent or received an IOU, in seconds since Jan. 1, 1970
// Return null if you can't find any activity for the user.
// HINT: Try looking at the way 'getAllFunctionCalls' is written. You can modify it if you'd like.
function getLastActive(user) {
	let current = web3.eth.blockNumber;
    while(current != GENESIS) {
		let now = web3.eth.getBlock(current, true);
		let alls = now.transactions;
		for(let all of alls) {
			if(all.to === contractAddress) {
				let f = abiDecoder.decodeMethod(all.input);
				if(f && f.name === "add_IOU") {
					let args = f.params.map(x => x.value);
					if(args[0] === user || all.from === user)	return now.timestamp;
				}
			}
		}
		current = now.parentHash;
	}
	return null;
}

// TODO: add an IOU ('I owe you') to the system
// The person you owe money is passed as 'creditor'
// The amount you owe them is passed as 'amount'
function add_IOU(creditor, amount) {
	let path = doBFS(creditor, web3.eth.defaultAccount, getNeighbors);
    log("path", path);
	let min_edge = 0;
    if(path === null) {
        console.log("can't find path")
    } else {
        min_edge = amount;
        let i = 1;
        while(i < path.length) {
            let t = BlockchainSplitwise.lookup.call(path[i - 1], path[i]).toNumber();
			min_edge = Math.min(t, min_edge);
            i += 1;
        }
		i = 1;
		console.log(min_edge);
        while(i < path.length) {
            BlockchainSplitwise.clear_IOU(path[i - 1], path[i], min_edge);
            i += 1;
        }
    }
	BlockchainSplitwise.add_IOU(creditor, amount - min_edge)
}

function getNeighbors(user) {
	let neighbors = [];
	let users = getUsers();
	for(let i of users) {
		console.log("1");
		if(BlockchainSplitwise.lookup.call(user, i).toNumber() > 0) {
			console.log("2");
			neighbors.push(i);
		}
	}
	return neighbors;
}

// =============================================================================
//                              Provided Functions 
// =============================================================================
// Reading and understanding these should help you implement the above

// This searches the block history for all calls to 'functionName' (string) on the 'addressOfContract' (string) contract
// It returns an array of objects, one for each call, containing the sender ('from') and arguments ('args')
function getAllFunctionCalls(addressOfContract, functionName) {
	let curBlock = web3.eth.blockNumber;
	let function_calls = [];
	while (curBlock !== GENESIS) {
	  let b = web3.eth.getBlock(curBlock, true);
	  let txns = b.transactions;
	  for (let j = 0; j < txns.length; j++) {
	  	let txn = txns[j];
	  	// check that destination of txn is our contract
	  	if (txn.to === addressOfContract) {
	  		let func_call = abiDecoder.decodeMethod(txn.input);
	  		// check that the function getting called in this txn is 'functionName'
	  		if (func_call && func_call.name === functionName) {
	  			let args = func_call.params.map(function (x) {return x.value});
	  			function_calls.push({
	  				from: txn.from,
	  				args: args
	  			})
	  		}
	  	}
	  }
	  curBlock = b.parentHash;
	}
	return function_calls;
}

// We've provided a breadth-first search implementation for you, if that's useful
// It will find a path from start to end (or return null if none exists)
// You just need to pass in a function ('getNeighbors') that takes a node (string) and returns its neighbors (as an array)
function doBFS(start, end, getNeighbors) {
	let queue = [[start]];
	while (queue.length > 0) {
		let cur = queue.shift();
		let lastNode = cur[cur.length-1];
		if (lastNode === end) {
			return cur;
		} else {
			let neighbors = getNeighbors(lastNode);
			for (let i = 0; i < neighbors.length; i++) {
				queue.push(cur.concat([neighbors[i]]));
			}
		}
	}
	return null;
}
// =============================================================================
//                                      UI 
// =============================================================================

// This code updates the 'My Account' UI with the results of your functions
$("#total_owed").html("$"+getTotalOwed(web3.eth.defaultAccount));
$("#last_active").html(timeConverter(getLastActive(web3.eth.defaultAccount)));
$("#myaccount").change(function() {
	web3.eth.defaultAccount = $(this).val();
	$("#total_owed").html("$"+getTotalOwed(web3.eth.defaultAccount));
	$("#last_active").html(timeConverter(getLastActive(web3.eth.defaultAccount)))
});

// Allows switching between accounts in 'My Account' and the 'fast-copy' in 'Address of person you owe
var opts = web3.eth.accounts.map(function (a) { return '<option value="'+a+'">'+a+'</option>' })
$(".account").html(opts);
$(".wallet_addresses").html(web3.eth.accounts.map(function (a) { return '<li>'+a+'</li>' }))

// This code updates the 'Users' list in the UI with the results of your function
$("#all_users").html(getUsers().map(function (u,i) { return "<li>"+u+"</li>" }));

// This runs the 'add_IOU' function when you click the button
// It passes the values from the two inputs above
$("#addiou").click(function() {
  add_IOU($("#creditor").val(), $("#amount").val());
  window.location.reload(true); // refreshes the page after
});

// This is a log function, provided if you want to display things to the page instead of the JavaScript console
// Pass in a discription of what you're printing, and then the object to print
function log(description, obj) {
	$("#log").html($("#log").html() + description + ": " + JSON.stringify(obj, null, 2) + "\n\n");
}


