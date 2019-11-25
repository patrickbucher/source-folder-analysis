package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strings"
)

const PathSeperator = "/"

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

type Node struct {
	Name     string           `json:"name"`
	Code     int              `json:"code"`
	Comment  int              `json:"comment"`
	Blank    int              `json:"blank"`
	Children map[string]*Node `json:"children"`
}

func main() {
	content, err := ioutil.ReadAll(os.Stdin)
	if err != nil {
		log.Fatalf("read from STDIN: %v", err)
	}
	var slocStats SlocStats
	err = json.Unmarshal(content, &slocStats)
	if err != nil {
		log.Fatalf("unmarshal source content: %v", err)
	}
	root := Node{
		Name:     "/",
		Code:     0,
		Comment:  0,
		Blank:    0,
		Children: make(map[string]*Node, 0),
	}
	for _, f := range slocStats.Files {
		attach(&root, &f)
	}
	buf, err := json.Marshal(root)
	if err != nil {
		log.Fatalf("marshal tree: %v", err)
	}
	fmt.Println(string(buf))
	/*
		err = ioutil.WriteFile(TargetFile, buf, 0644)
	*/
}

func attach(parent *Node, entry *FileEntry) {
	parent.Code += entry.Code
	parent.Comment += entry.Comment
	parent.Blank += entry.Blank
	segments := strings.Split(entry.Name, PathSeperator)
	for _, segment := range segments[1:2] {
		if node, ok := parent.Children[segment]; ok {
			reducedName := strings.Join(segments[1:], PathSeperator)
			entry.Name = reducedName
			attach(node, entry)
		} else {
			child := Node{
				Name:     segment,
				Code:     entry.Code,
				Comment:  entry.Comment,
				Blank:    entry.Blank,
				Children: make(map[string]*Node, 0),
			}
			parent.Children[segment] = &child
		}
	}
}
