import { appendFile } from 'fs/promises';
import { resolve } from 'path';

import * as DebugLib from 'debug';

import Env from './debug.env.js';
const { getEnv, getEnvBoolean, setEnv } = Env;

import Callee from './callee.js';
const { getCallingFilename, getCallingFunctionName } = Callee;

import { Debugger } from 'debug';

import Constants from '../configuration/constants.js';
const {
    DEBUGGING,
    LOGGING,
    LOGGING_FILEPATH
} = Constants;

export namespace DebugLogging {
    /**
     * Set debug file log path
     * 
     * @param params.filePath File path
     * @param params.unset Is to unset
     * @example
     * ```
     * setLogPath({ filePath, unset });
     * ```
     * @returns `true` on success or `false` on failure
     * @since 0.0.1
     */
    export function setLogPath({ filePath, unset = false }:
        { filePath: string, unset?: boolean }): boolean {

        try {
            const isToSet: boolean = !unset;
            if (isToSet)
                setEnv({ envVarName: LOGGING_FILEPATH, varValue: filePath });
            else
                setEnv({ envVarName: LOGGING_FILEPATH, varValue: '' });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Log a debug message to console and log to file if enabled
     * 
     * @param params.message Debug message
     * @param params.color Debug color "function" from `color-cli`
     * @example
     * ```
     * log({ message, color });
     * ```
     * @returns Nada
     * @since 0.0.1
     */   
    export function log({ message, color }:
        { message: string, color: Function }): void {

        const debugDisabled: boolean = !(getEnvBoolean({ envVarName: DEBUGGING }));
        if (debugDisabled === true) return;

        const calleeFunction: string | null = getCallingFunctionName();
        const calleeFilename: string | null = getCallingFilename();
        if (calleeFunction === null || calleeFilename === null)
            console.log(`   Debug error, there was an error getting callee function or filename`);
            //throw new Error(`Can't debug, there was an error getting callee function or filename`);

        const loggingEnabled: boolean = getEnvBoolean({ envVarName: LOGGING });
        if (loggingEnabled === true && calleeFunction !== 'logToFile') {
            const logMessage: string = `${calleeFilename}::${calleeFunction} ::: ${message}`;
            logToFile({ message: logMessage });
        }

        const debug: Debugger = DebugLib.default(`${calleeFilename}::${calleeFunction}`);
        debug.enabled = true;
        debug(color(message));
        return;
    }
    export const logMessage = log;

    /**
     * Log a message to a file
     * 
     * @param params.message Debug message to log
     * @example
     * ```
     * logToFile({ message });
     * ```
     * @returns `true` on success, `false` on failure
     * @since 0.0.1
     */
    export async function logToFile({ message }:
        { message: string }): Promise<boolean> {
        try {
            const fileLogPath: string = getEnv({ envVarName: LOGGING_FILEPATH });
            const resolvedFileLogPath: string = getResolvedPath({ filePath: fileLogPath });
            await appendFile(resolvedFileLogPath, message);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @internal
     * Get resolved/full path from a relative one
     * 
     * @param params.filePath Relative file path
     * @example
     * ```
     * getResolvedPath({ filePath });
     * ```
     * @returns Resolved/Full path
     * @since 0.0.1
     */
    function getResolvedPath({ filePath }:
        { filePath: string }): string {
        const resolvedPath: string = resolve(filePath);
        return resolvedPath;
    }
}

export default DebugLogging;