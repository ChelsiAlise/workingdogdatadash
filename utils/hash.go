/*
	this script creates a password hash
	go run hash.go salt1 salt2 username password
*/
package main

import (
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"os"
)

func main() {
	nArgs := len(os.Args)

	username := os.Args[nArgs-4]
	password := os.Args[nArgs-3]
	salt1 := os.Args[nArgs-2]
	salt2 := os.Args[nArgs-1]

	h := sha256.New()
	io.WriteString(h, salt1)
	io.WriteString(h, username)
	io.WriteString(h, salt2)
	io.WriteString(h, password)
	s := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%x", h.Sum(nil))))

	println(s)
}
