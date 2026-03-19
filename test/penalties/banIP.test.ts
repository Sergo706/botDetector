import { it, describe, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import type { BannedInfo } from '~~/src/botDetector/types/checkersTypes.js';

vi.mock('child_process', () => ({ spawn: vi.fn() }));

import { spawn } from 'child_process';
import { banIp } from '~~/src/botDetector/penalties/banIP.js';

const mockSpawn = vi.mocked(spawn);

const INFO: BannedInfo = { score: 80, reasons: ['CLI_OR_LIBRARY', 'PROXY_DETECTED'] };

function makeFakeChild() {
    const child = new EventEmitter() as any;
    child.stderr = new EventEmitter();
    child.kill = vi.fn();
    child.unref = vi.fn();
    return child;
}

beforeEach(() => {
    vi.useFakeTimers();
    (getConfiguration().punishmentType as any).enableFireWallBan = true;
});

afterEach(() => {
    vi.useRealTimers();
    (getConfiguration().punishmentType as any).enableFireWallBan = false;
    vi.clearAllMocks();
});

describe('banIp', () => {
    describe('firewall ban disabled', () => {
        it('returns void immediately without calling spawn', () => {
            (getConfiguration().punishmentType as any).enableFireWallBan = false;
            const result = banIp('1.2.3.4', INFO);
            expect(result).toBeUndefined();
            expect(mockSpawn).not.toHaveBeenCalled();
        });
    });

    describe('spawn args', () => {
        it('calls spawn with correct sudo + ufw args for the given IP', () => {
            const child = makeFakeChild();
            mockSpawn.mockReturnValue(child);
            banIp('1.2.3.4', INFO);
            expect(mockSpawn).toHaveBeenCalledOnce();
            expect(mockSpawn).toHaveBeenCalledWith(
                'sudo',
                ['-n', '/usr/sbin/ufw', 'insert', '1', 'deny', 'from', '1.2.3.4'],
                expect.objectContaining({ stdio: ['ignore', 'ignore', 'pipe'], detached: true }),
            );
        });
    });

    describe('close event, success', () => {
        it('resolves when the child closes with code 0', async () => {
            const child = makeFakeChild();
            mockSpawn.mockReturnValue(child);

            const promise = banIp('1.2.3.4', INFO) as Promise<void>;
            child.emit('close', 0);

            await expect(promise).resolves.toBeUndefined();
        });
    });

    describe('close event, failure', () => {
        it('rejects with "ufw exited N" when child closes with non zero code', async () => {
            const child = makeFakeChild();
            mockSpawn.mockReturnValue(child);

            const promise = banIp('1.2.3.4', INFO) as Promise<void>;
            child.emit('close', 1);

            await expect(promise).rejects.toThrow('ufw exited 1');
        });

        it('rejects with the exact exit code in the message', async () => {
            const child = makeFakeChild();
            mockSpawn.mockReturnValue(child);

            const promise = banIp('5.5.5.5', INFO) as Promise<void>;
            child.emit('close', 127);

            await expect(promise).rejects.toThrow('ufw exited 127');
        });
    });

    describe('error event', () => {
        it('rejects with the spawned error when child emits an error event', async () => {
            const child = makeFakeChild();
            mockSpawn.mockReturnValue(child);

            const promise = banIp('1.2.3.4', INFO) as Promise<void>;
            const spawnErr = new Error('ENOENT: spawn sudo not found');
            child.emit('error', spawnErr);

            await expect(promise).rejects.toThrow('ENOENT: spawn sudo not found');
        });
    });

    describe('timeout', () => {
        it('kills the child and rejects with a timeout message after 5 seconds', async () => {
            const child = makeFakeChild();
            mockSpawn.mockReturnValue(child);

            const promise = banIp('1.2.3.4', INFO) as Promise<void>;

            vi.advanceTimersByTime(5_000);

            await expect(promise).rejects.toThrow('ufw hang timeout on 1.2.3.4');
            expect(child.kill).toHaveBeenCalledWith('SIGKILL');
        });

        it('does NOT fire timeout when child closes before 5 seconds', async () => {
            const child = makeFakeChild();
            mockSpawn.mockReturnValue(child);

            const promise = banIp('1.2.3.4', INFO) as Promise<void>;
            child.emit('close', 0);

            await promise;

            vi.advanceTimersByTime(5_000);
            expect(child.kill).not.toHaveBeenCalled();
        });
    });
});
