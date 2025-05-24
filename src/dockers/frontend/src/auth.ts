import { User } from "./data/User";
import { UserJwt } from "./data/UserJwt";

let currentUser: UserJwt | null = null;
export async function fetchUser(): Promise<UserJwt | null> {
  if (currentUser) return currentUser;
  try {
	const response = await fetch(
	  "https://transcendence.42.fr/api/v1/auth/me",
	  {
		method: "GET",
		credentials: "include",
	  }
	);
	if (!response.ok) {
	  throw new Error("Network response was not ok");
	}
	const data: {valid:boolean, user:UserJwt} = await response.json();
	return (data.valid)? data.user:null;
  } catch (error) {
	console.error("Error fetching user data:", error);
  }
  return null;
}
