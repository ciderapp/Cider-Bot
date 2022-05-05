import { RunOptions } from './RunOptions.js';

export interface Command {
	// value: any;
	name: string;
	description: string;
	permission?: string;
	options?: object[];
	run(data: RunOptions): Promise<unknown>;
}
