package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
)

const (
	SourceFile = "slocstats.json"
	TargetFile = "sourcetree.json"
)

type SlocStats struct {
	Files []FileEntry
	Total StatsEntry
}

type FileEntry struct {
	Code    int    `json:"code"`
	Comment int    `json:"comment"`
	Blank   int    `json:"blank"`
	Name    string `json:"name"`
	Lang    string `json:"Lang"`
}

type StatsEntry struct {
	Files   int `json:"files"`
	Code    int `json:"code"`
	Comment int `json:"comment"`
	Blank   int `json:"blank"`
}

func main() {
	source, err := os.Open(SourceFile)
	if err != nil {
		log.Fatalf("open file %s: %v", SourceFile, err)
	}
	defer source.Close()
	content, err := ioutil.ReadAll(source)
	if err != nil {
		log.Fatalf("read from file %s: %v", SourceFile, err)
	}
	var slocStats SlocStats
	err = json.Unmarshal(content, &slocStats)
	if err != nil {
		log.Fatalf("unmarshal source content: %v", err)
	}
	for _, f := range slocStats.Files {
		fmt.Printf("%d %d %d %s %s\n", f.Code, f.Comment, f.Blank, f.Name, f.Lang)
	}
}
