/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ITextBufferBuilder, ITextBufferFactory, ITextBuffer, DefaultEndOfLine } from 'vs/editor/common/model';
import { LinesTextBufferBuilder } from 'vs/editor/common/model/linesTextBuffer/linesTextBufferBuilder';
import { PieceTreeTextBufferBuilder } from 'vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder';

export function doBenchmark<T>(id: string, ts: T[], fn: (t: T) => void) {
	let columns: string[] = [id];
	for (let i = 0; i < ts.length; i++) {
		var start = process.hrtime();
		fn(ts[i]);
		var diff = process.hrtime(start);
		columns.push(`${(diff[0] * 1000 + diff[1] / 1000000).toFixed(3)} ms`);
	}
	console.log('|' + columns.join('\t|') + '|');
}

export interface IBenchmark {
	name: string;
	/**
	 * Before each cycle, this function will be called to create TextBufferFactory
	 */
	buildBuffer: (textBufferBuilder: ITextBufferBuilder) => ITextBufferFactory;
	/**
	 * Before each cycle, this function will be called to do pre-work for text buffer.
	 * This will be called onece `buildBuffer` is finished.
	 */
	preCycle: (textBuffer: ITextBuffer) => void;
	/**
	 * The function we are benchmarking
	 */
	fn: (textBuffer: ITextBuffer) => void;
}

export class BenchmarkSuite {
	name: string;
	benchmarks: IBenchmark[];

	constructor(suiteOptions: { name: string }) {
		this.name = suiteOptions.name;
		this.benchmarks = [];
	}

	add(benchmark: IBenchmark) {
		this.benchmarks.push(benchmark);
	}

	run() {
		console.log(`|${this.name}\t|line buffer\t|piece table\t|`);
		console.log('|---|---|---|');
		for (let i = 0; i < this.benchmarks.length; i++) {
			let benchmark = this.benchmarks[i];
			let columns: string[] = [benchmark.name];
			[new LinesTextBufferBuilder(), new PieceTreeTextBufferBuilder()].forEach((builder: ITextBufferBuilder) => {
				let factory = benchmark.buildBuffer(builder);
				let buffer = factory.create(DefaultEndOfLine.LF);
				benchmark.preCycle(buffer);
				var start = process.hrtime();
				benchmark.fn(buffer);
				var diff = process.hrtime(start);
				columns.push(`${(diff[0] * 1000 + diff[1] / 1000000).toFixed(3)} ms`);
			});
			console.log('|' + columns.join('\t|') + '|');
		}
		console.log('\n');
	}
}
