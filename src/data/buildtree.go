// buildtree converts the JSON output from gocloc to a tree structure.
package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strings"
)

// PathSeparator is the separator used in the input data structure.
const PathSeparator = "/"

// SlocStats represents the input data structure.
type SlocStats struct {
	Files []FileEntry
	Total StatsEntry
}

// FileEntry represents the statistics on a single file (leaf).
type FileEntry struct {
	Code    int    `json:"code"`
	Comment int    `json:"comment"`
	Blank   int    `json:"blank"`
	Name    string `json:"name"`
	Lang    string `json:"Lang"`
}

// StatsEntry represents the total statistics.
type StatsEntry struct {
	Files   int `json:"files"`
	Code    int `json:"code"`
	Comment int `json:"comment"`
	Blank   int `json:"blank"`
}

// Node represents a folder or source file in the output tree.
type Node struct {
	Name     string       `json:"name"`
	Code     int          `json:"code"`
	Comment  int          `json:"comment"`
	Blank    int          `json:"blank"`
	Language string       `json:"language,omitempty"`
	Children CollapsedMap `json:"children,omitempty"`
	root     bool
}

// CollapsedMap is a map that is rendered as an array in JSON.
type CollapsedMap map[string]*Node

// MarshalJSON marshals a map as an array, i.e. by omitting the key.
func (c CollapsedMap) MarshalJSON() ([]byte, error) {
	output := make([]*Node, 0)
	for _, value := range c {
		output = append(output, value)
	}
	return json.Marshal(output)
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
		Name:     "",
		Code:     0,
		Comment:  0,
		Blank:    0,
		Children: make(map[string]*Node, 0),
		root:     true,
	}
	for _, f := range slocStats.Files {
		attach(&root, &f)
	}
	buf, err := json.Marshal(root)
	if err != nil {
		log.Fatalf("marshal tree: %v", err)
	}
	fmt.Println(string(buf))
}

func attach(parent *Node, entry *FileEntry) {
	parent.Code += entry.Code
	parent.Comment += entry.Comment
	parent.Blank += entry.Blank
	segments := strings.Split(entry.Name, PathSeparator)
	startSegment := 0
	if parent.root {
		startSegment++
	}
	segment := segments[startSegment]
	if node, ok := parent.Children[segment]; ok {
		reducedName := strings.Join(segments[startSegment+1:], PathSeparator)
		entry.Name = reducedName
		attach(node, entry)
	} else {
		lang := ""
		if len(segments) == 1 {
			// leaf
			lang = entry.Lang
		}
		child := Node{
			Name:     segment,
			Code:     entry.Code,
			Comment:  entry.Comment,
			Blank:    entry.Blank,
			Language: lang,
			Children: make(map[string]*Node, 0),
		}
		parent.Children[segment] = &child
	}
}
