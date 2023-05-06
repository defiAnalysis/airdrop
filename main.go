package main

import "airdrop/server"

func main() {
	airdrop := server.CreateAirdrop(100, 50, 1)
	airdrop.Run()
}
