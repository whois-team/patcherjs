import Configuration from './configuration/configuration.js';
const { readConfiguration } = Configuration;

import Commands from './commands/commands.js';
const { runCommands } = Commands;

import Filedrops from './filedrops/filedrops.js';
const { runFiledrops } = Filedrops;

import Patches from './patches/patches.js';
const { runPatches } = Patches;

import Packaging from './build/packaging.js';
const { runPackings } = Packaging;

import Uac from './auxiliary/uac.js';
const { adminCheck } = Uac;

import debug from './auxiliary/debug.js';
import Debug from './auxiliary/debug.js';
const { log } = Debug;

import colorsCli from 'colors-cli';
const { green_bt, red_bt, white } = colorsCli;

import Console from './auxiliary/console.js';
const { waitForKeypress } = Console;

import {
    ConfigurationObject
} from './configuration/configuration.types.js';

import Constants from './configuration/constants.js';
const {
    COMP_COMMANDS,
    COMP_FILEDROPS,
    COMP_PATCHES,
    CONFIG_FILEPATH
} = Constants;

export namespace Patcher {
    /**
     * Autonomously run the patcher based on config file
     * 
     * @param params.configFilePath Configuration file path
     * @example
     * ```
     * runPatcher({ configFilePath });
     * ```
     * @returns Nada
     * @since 0.0.1
     */
    export async function runPatcher({ configFilePath = CONFIG_FILEPATH }:
        { configFilePath?: string }): Promise<void> {
        try {
            const configuration: ConfigurationObject = await readConfiguration({ filePath: configFilePath });
            await runGeneralChecksAndInit({ configuration });
            const { onlyPackingMode } = configuration.options.general;
            if (onlyPackingMode === true) {
                await packAndEncryptFile({ configuration });
            } else {
                const { runningOrder } = configuration.options.general;
                for (const nextFunction of runningOrder)
                    await runFunction({ configuration, functionName: nextFunction });
            }
        } catch (error) {
            log({ message: `There was an error running patcher: ${error}`, color: red_bt });
        } finally {
            log({ message: `Patcher finished running`, color: green_bt });
            log({ message: `Press any key to close application...`, color: white });
            await waitForKeypress();
        }
    }

    /**
     * Pack and encrypt file when in packing mode
     * 
     * @param params.configuration Configuration object
     * @example
     * ```
     * packAndEncryptFile({ configuration });
     * ```
     * @returns Nada
     * @since 0.0.1
     */
    export async function packAndEncryptFile({ configuration }:
        { configuration: ConfigurationObject }): Promise<void> {
        try {
            await runPackings({ configuration });
        } catch (error) {
            log({ message: `Failed to run pack and encrypt file function`, color: red_bt });
        }
    }

    /**
     * Run a specific patcher function
     * 
     * @param params.configuration Configuration object
     * @param params.functionName Fixed function name
     * @example
     * ```
     * runFunction({ configuration, functionName });
     * ```
     * @returns Nada
     * @since 0.0.1
     */
    export async function runFunction({ configuration, functionName }:
        { configuration: ConfigurationObject, functionName: string }): Promise<void> {
        try {
            switch (functionName) {
                case COMP_COMMANDS:
                    await runCommands({ configuration });
                    break;
                case COMP_FILEDROPS:
                    await runFiledrops({ configuration });
                    break;
                case COMP_PATCHES:
                    await runPatches({ configuration });
                    break;
                default:
                    throw new Error(`Unknown function: ${functionName}`);
            }
        } catch (error) {
            log({ message: `Failed to process function ${error}`, color: red_bt });
            return;
        }
    }

    /**
     * Run general initial checks such as admin privileges check
     * 
     * @param params.configuration Configuration object
     * @example
     * ```
     * runGeneralChecksAndInit({ configuration });
     * ```
     * @returns Nada
     * @since 0.0.1
     */
    export async function runGeneralChecksAndInit({ configuration }:
        { configuration: ConfigurationObject }): Promise<void> {
        const { general } = configuration.options;
        if (general.debug === true) await debug.enable({ logging: general.logging });
        if (general.exitOnNonAdmin === true) await adminCheck();
    }
}

export default Patcher;
