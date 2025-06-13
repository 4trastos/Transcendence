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
	const data: {valid:boolean, decoded:UserJwt} = await response.json();
	return (data.valid)? data.decoded:null;
  } catch (error) {
	console.error("Error fetching user data:", error);
  }
  return null;
}
