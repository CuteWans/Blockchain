from sys import exit
from bitcoin.core.script import *

from utils import *
from config import my_private_key, my_public_key, my_address, faucet_address
from ex1 import send_from_P2PKH_transaction
from bitcoin.wallet import CBitcoinAddress, CBitcoinSecret, P2PKHBitcoinAddress


cust1_private_key = CBitcoinSecret(
    'cTqV2yaBVwNBx5CiV4dqJBiPT2TMW43vThWxwNVXA744Wu9BLwm3')
cust1_public_key = cust1_private_key.pub
cust2_private_key = CBitcoinSecret(
    'cUkL5HBxHHqjeo1TjPCz3EB1yfUEnmrvMKi18HLeVxuDsV7L5NeY')
cust2_public_key = cust2_private_key.pub
cust3_private_key = CBitcoinSecret(
    'cMsRq4v1YfDv7qyZvashTUYJXoyyQrWy9jGDeQJoDvzefCEBEKQd')
cust3_public_key = cust3_private_key.pub


######################################################################
# TODO: Complete the scriptPubKey implementation for Exercise 2

# You can assume the role of the bank for the purposes of this problem
# and use my_public_key and my_private_key in lieu of bank_public_key and
# bank_private_key.

ex2a_txout_scriptPubKey = [my_public_key, OP_CHECKSIGVERIFY, OP_1, cust1_public_key, cust2_public_key, cust3_public_key, OP_3, OP_CHECKMULTISIG]
######################################################################

if __name__ == '__main__':
    ######################################################################
    # TODO: set these parameters correctly
    amount_to_send = 0.0015
    txid_to_spend = (
        '16cdf1751652cd0c099ea31a6bc016043b27e159a83e6ad19e1a86b2f39a9449')
    utxo_index = 0
    ######################################################################

    response = send_from_P2PKH_transaction(
        amount_to_send, txid_to_spend, utxo_index,
        ex2a_txout_scriptPubKey)
    print(response.status_code, response.reason)
    print(response.text)
