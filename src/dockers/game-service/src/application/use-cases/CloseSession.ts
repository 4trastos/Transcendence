

export default class CloseSession {
		constructor() {
		}
	
		async execute(connection:any, req:any, onStatusChange: (req:any, status: string) => void): Promise<void> {
			connection.on('close', () => {
				try {
					onStatusChange(req,"close");
				}catch (err) {
					console.error(err);
				}
				connection.close();
			});
		};
}