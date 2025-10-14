import dgram from 'dgram';
import net from 'net';
import normalizer from './normalizer.js';
import Log from '../models/Log.js';

class SyslogServer {
    constructor(options = {}) {
        this.options = {
            udpPort: options.udpPort || 514,
            tcpPort: options.tcpPort || 514,
            host: options.host || '0.0.0.0',
            tenant: options.tenant || 'default'
        };
    }

    start() {
        this.startUDPServer();
        this.startTCPServer();
    }

    startUDPServer() {
        const server = dgram.createSocket('udp4');

        server.on('error', (err) => {
            console.error('UDP Syslog server error:', err);
        });

        server.on('message', async (msg, rinfo) => {
            try {
                const logStr = msg.toString();
                console.log(`UDP log received from ${rinfo.address}:${rinfo.port}`);
                
                // Parse and store the log
                const normalized = normalizer.normalizeSyslog({
                    message: logStr,
                    host: rinfo.address
                });

                await Log.create(normalized);
            } catch (error) {
                console.error('Error processing UDP syslog message:', error);
            }
        });

        server.bind(this.options.udpPort, this.options.host);
        console.log(`UDP Syslog server listening on ${this.options.host}:${this.options.udpPort}`);
    }

    startTCPServer() {
        const server = net.createServer((socket) => {
            const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
            console.log(`TCP client connected: ${clientAddress}`);

            let buffer = '';

            socket.on('data', async (data) => {
                try {
                    buffer += data.toString();
                    
                    // Split on newlines to handle multiple messages
                    const messages = buffer.split('\\n');
                    
                    // Keep the last partial message in the buffer
                    buffer = messages.pop();

                    // Process complete messages
                    for (const msg of messages) {
                        if (msg.trim()) {
                            const normalized = normalizer.normalizeSyslog({
                                message: msg,
                                host: socket.remoteAddress
                            });

                            await Log.create(normalized);
                        }
                    }
                } catch (error) {
                    console.error('Error processing TCP syslog message:', error);
                }
            });

            socket.on('end', () => {
                console.log(`TCP client disconnected: ${clientAddress}`);
            });

            socket.on('error', (err) => {
                console.error(`TCP socket error from ${clientAddress}:`, err);
            });
        });

        server.listen(this.options.tcpPort, this.options.host, () => {
            console.log(`TCP Syslog server listening on ${this.options.host}:${this.options.tcpPort}`);
        });

        server.on('error', (err) => {
            console.error('TCP Syslog server error:', err);
        });
    }
}

export default SyslogServer;