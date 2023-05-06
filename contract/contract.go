package contract

import (
	"github.com/ethereum/go-ethereum/accounts/abi"
	"strings"
)

func GetAbi(abiStr string) (abi.ABI, error) {
	r := strings.NewReader(abiStr)
	a, err := abi.JSON(r)
	return a, err
}
