import { Position } from 'vscode-languageserver';
import {
    AbstractNode,
    AbstractNodeDocument,
    isArrayNode,
    isAssignmentNode,
    isObjectNode,
} from '../parser/ast';
import { CosmoteerFile } from '../workspace/cosmoteer-workspace.service';
import { readFile } from 'fs/promises';
import { lexer } from '../lexer/lexer';
import { parser } from '../parser/parser';

export const parseFile = async (
    file: CosmoteerFile & { readonly path: string }
): Promise<AbstractNodeDocument> => {
    const data = await readFile(file.path, { encoding: 'utf-8' });
    const document = parser(lexer(data), file.path).value;
    return document;
};

export const parseFilePath = async (path: string) => {
    const data = await readFile(path, { encoding: 'utf-8' });
    const document = parser(lexer(data), path).value;
    return document;
};

export const findNodeAtPosition = (
    document: AbstractNodeDocument,
    position: Position
) => {
    for (const node of document.elements) {
        const foundNode = findNodeAtPositionRecursive(node, position);
        if (foundNode) {
            return foundNode;
        }
    }
};

const findNodeAtPositionRecursive = (
    node: AbstractNode,
    position: Position
): AbstractNode | undefined => {
    if (isObjectNode(node)) {
        for (const property of node.elements) {
            if (node.inheritance) {
                for (const inheritance of node.inheritance) {
                    const foundNode = findNodeAtPositionRecursive(
                        inheritance,
                        position
                    );
                    if (foundNode) {
                        return foundNode;
                    }
                }
            }
            const foundNode = findNodeAtPositionRecursive(property, position);
            if (foundNode) {
                return foundNode;
            }
        }
    } else if (isArrayNode(node)) {
        if (node.inheritance) {
            for (const inheritance of node.inheritance) {
                const foundNode = findNodeAtPositionRecursive(
                    inheritance,
                    position
                );
                if (foundNode) {
                    return foundNode;
                }
            }
        }
        for (const element of node.elements) {
            const foundNode = findNodeAtPositionRecursive(element, position);
            if (foundNode) {
                return foundNode;
            }
        }
    } else if (isAssignmentNode(node)) {
        if (
            node.right &&
            position.line === node.right.position.line &&
            position.character <= node.right.position.characterEnd &&
            position.character >= node.right.position.characterStart
        ) {
            return node.right;
        }
    } else {
        if (
            node.position &&
            position.line === node.position.line &&
            position.character <= node.position.characterEnd &&
            position.character >= node.position.characterStart
        ) {
            return node;
        }
    }
    return undefined;
};

export const getStartOfAstNode = (node: AbstractNode): AbstractNodeDocument => {
    if (node.parent) {
        return getStartOfAstNode(node.parent);
    }
    return node as AbstractNodeDocument;
};


