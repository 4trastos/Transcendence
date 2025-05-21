

/**
 * @description: HandleException class for handling exceptions in the application.
 * @extends Error
 * @author Adrian Herrera
 * @date 2023-10-01
 * 
 */
export class HandleException extends Error {
	public code: number;
	public error: Error;

	constructor(message: string, code: number = undefined, name: string = "HandleException", error: Error = null) {
		super(message);
		this.name = name;
		this.code = code;
		this.error = error;
	}


}