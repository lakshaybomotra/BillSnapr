import { Buffer } from 'buffer';

const ESC = '\x1B';
const GS = '\x1D';

export class EscPosBuilder {
    private buffer: number[] = [];

    constructor() {
        this.initialize();
    }

    // Initialize printer
    initialize() {
        this.buffer.push(0x1B, 0x40);
        return this;
    }

    // Add text
    text(content: string) {
        const bytes = Buffer.from(content, 'utf-8');
        bytes.forEach((b) => this.buffer.push(b));
        return this;
    }

    // Add text with newline
    textLine(content: string) {
        return this.text(content).text('\n');
    }

    // Feed lines
    feed(lines: number = 1) {
        this.buffer.push(0x1B, 0x64, lines);
        return this;
    }

    // Alignment: 'left' | 'center' | 'right'
    align(alignment: 'left' | 'center' | 'right') {
        let val = 0;
        switch (alignment) {
            case 'center': val = 1; break;
            case 'right': val = 2; break;
            default: val = 0;
        }
        this.buffer.push(0x1B, 0x61, val);
        return this;
    }

    // Bold text
    bold(enabled: boolean) {
        this.buffer.push(0x1B, 0x45, enabled ? 1 : 0);
        return this;
    }

    // Text size (0-7 for width/height)
    size(width: number, height: number) {
        // GS ! n
        // n = (width-1)*16 + (height-1)
        // Limits 0-7, so max value is 0x77
        const n = ((width & 0x7) << 4) | (height & 0x7);
        this.buffer.push(0x1D, 0x21, n);
        return this;
    }

    // Print two-column layout with fixed right column and word-wrap left column
    columns(left: string, right: string, width: number = 32) {
        const minGap = 1;
        const maxLeft = width - right.length - minGap;

        if (left.length <= maxLeft) {
            const spaces = ' '.repeat(width - left.length - right.length);
            return this.textLine(left + spaces + right);
        }

        // Word-boundary wrap: find last space within maxLeft
        let breakAt = left.lastIndexOf(' ', maxLeft);
        if (breakAt <= 0) breakAt = maxLeft; // no space found, hard break

        const firstLine = left.substring(0, breakAt);
        const spaces = ' '.repeat(width - firstLine.length - right.length);
        this.textLine(firstLine + spaces + right);

        // Remaining lines: word-wrapped with indent
        let remaining = left.substring(breakAt).trimStart();
        const indent = '  ';
        const wrapWidth = width - indent.length;
        while (remaining.length > 0) {
            if (remaining.length <= wrapWidth) {
                this.textLine(indent + remaining);
                break;
            }
            let lineBreak = remaining.lastIndexOf(' ', wrapWidth);
            if (lineBreak <= 0) lineBreak = wrapWidth;
            this.textLine(indent + remaining.substring(0, lineBreak));
            remaining = remaining.substring(lineBreak).trimStart();
        }

        return this;
    }

    // Cut paper
    cut() {
        this.buffer.push(0x1D, 0x56, 66, 0);
        return this;
    }

    // Draw a horizontal line (approximate with dashes)
    line() {
        return this.textLine('--------------------------------');
    }

    // Get final buffer
    getBuffer() {
        return Buffer.from(this.buffer);
    }
}
