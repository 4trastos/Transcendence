import { User } from "./data/User";
import { UserJwt } from "./data/UserJwt";

let currentUser: UserJwt | null = null;
export async function fetchUser(): Promise<UserJwt | null> {
  if (currentUser) return currentUser;
  try {
	const response = await fetch(
	  "http://localhost:3000/api/validate-token",
	  {
		method: "GET",
		credentials: "include",
	  }
	);
	if (!response.ok) {
	  throw new Error("Network response was not ok");
	}
	const body = await response.json();
	console.log("Body: " + JSON.stringify(body, null, 2))
	if (body.decoded.purpose === "2fa_verification"){
		return null;
	}
	const data: {valid:boolean, decoded:UserJwt} = body;
	return (data.valid)? data.decoded:null;
  } catch (error) {
	console.error("Error fetching user data:", error);
  }
  return null;
}
