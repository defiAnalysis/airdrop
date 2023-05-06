package server

import (
	contract2 "airdrop/contract"
	"context"
	"github.com/astaxie/beego"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"math/big"
)

func TokenAirdrop(chainId, contractId, privkey string, addrs []common.Address, values []*big.Int) (*types.Receipt, error) {
	rpc := beego.AppConfig.String("rpc::" + chainId)
	chainid, _ := beego.AppConfig.Int64("chainid::" + chainId)

	token := beego.AppConfig.String("token::" + chainId)
	//服务器地址
	conn, err := ethclient.Dial(rpc)
	if err != nil {
		beego.Error("Dial err", err)
		return nil, err
	}
	defer conn.Close()

	//创建合约对象

	contract, err := contract2.NewAirdrop(common.HexToAddress(contractId), conn)
	if err != nil {
		beego.Error("new contract error", err)
		return nil, err
	}
	privateKey, err := crypto.HexToECDSA(privkey[2:])
	if err != nil {
		beego.Error("new contract error", err)
		return nil, err
	}

	auth, err := bind.NewKeyedTransactorWithChainID(privateKey, new(big.Int).SetInt64(chainid))
	if err != nil {
		beego.Error("new contract error", err)
		return nil, err
	}

	tx, err := contract.MultiTransferToken(&bind.TransactOpts{
		From: auth.From,
		//Nonce:     nil,
		Signer: auth.Signer,
	}, common.HexToAddress(token), addrs, values)

	if err != nil {
		beego.Error(err)
		return nil, err
	}
	//等待挖矿完成
	receipt, err := bind.WaitMined(context.Background(), conn, tx)
	if err != nil {
		beego.Error("WaitMined error", err)
		return receipt, err
	}

	return receipt, nil
}
