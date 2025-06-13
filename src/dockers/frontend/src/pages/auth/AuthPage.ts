import { Component } from "../../utils/component";
import { CreateAccountComponent } from "./CreateAccountComponent";
import { LogInComponent } from "./LoginComponent";
import { RecoverPasswordComponent } from "./RecoverPasswordComponent";

export class AuthPage extends Component {
  constructor() {
	super();
	this.template = `
<div class="flex items-center justify-center w-screen h-screen min-h-screen min-w-screen">
	<div class="hidden xl:block w-[60vw] h-full justify-center items-center px-[2rem] py-[5rem] ">


		<div class="flex justify-center items-center backdrop-blur-md h-full w-full bg-opacity-10 bg-[#11162F] shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded relative">
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 600 150"
     overflow="visible"
     xmlns:xlink="http://www.w3.org/1999/xlink">

  <defs>
    <filter id="filter">
      <feFlood flood-color="#11162F" result="#11162F" />
      <feFlood flood-color="red" result="flood1" />
      <feFlood flood-color="limegreen" result="flood2" />
      <feOffset in="SourceGraphic" dx="2" dy="0" result="off1a"/>
      <feOffset in="SourceGraphic" dx="1" dy="0" result="off1b"/>
      <feOffset in="SourceGraphic" dx="-2" dy="0" result="off2a"/>
      <feOffset in="SourceGraphic" dx="-1" dy="0" result="off2b"/>
      <feComposite in="flood1" in2="off1a" operator="in" result="comp1" />
      <feComposite in="flood2" in2="off2a" operator="in" result="comp2" />

      <feMerge x="0" width="100%" result="merge1">
        <feMergeNode in="#11162F" />
        <feMergeNode in="comp1" />
        <feMergeNode in="off1b" />
        <animate attributeName="y" dur="4s" values="104px;104px;30px;105px;30px;2px;2px;50px;40px;105px;105px;20px;60px;40px;104px;40px;70px;10px;30px;104px;102px" keyTimes="0;0.362;0.368;0.421;0.440;0.477;0.518;0.564;0.593;0.613;0.644;0.693;0.721;0.736;0.772;0.818;0.844;0.894;0.925;0.939;1" repeatCount="indefinite"/>
        <animate attributeName="height" dur="4s" values="10px;0px;10px;30px;50px;0px;10px;0px;0px;0px;10px;50px;40px;0px;0px;0px;40px;30px;10px;0px;50px" keyTimes="0;0.362;0.368;0.421;0.440;0.477;0.518;0.564;0.593;0.613;0.644;0.693;0.721;0.736;0.772;0.818;0.844;0.894;0.925;0.939;1" repeatCount="indefinite"/>
      </feMerge>

      <feMerge x="0" width="100%" y="60px" height="65px" result="merge2">
        <feMergeNode in="#11162F" />
        <feMergeNode in="comp2" />
        <feMergeNode in="off2b" />
        <animate attributeName="y" dur="4s" values="103px;104px;69px;53px;42px;104px;78px;89px;96px;100px;67px;50px;96px;66px;88px;42px;13px;100px;100px;104px;" keyTimes="0;0.055;0.100;0.125;0.159;0.182;0.202;0.236;0.268;0.326;0.357;0.400;0.408;0.461;0.493;0.513;0.548;0.577;0.613;1" repeatCount="indefinite"/>
        <animate attributeName="height" dur="4s" values="0px;0px;0px;16px;16px;12px;12px;0px;0px;5px;10px;22px;33px;11px;0px;0px;10px" keyTimes="0;0.055;0.100;0.125;0.159;0.182;0.202;0.236;0.268;0.326;0.357;0.400;0.408;0.461;0.493;0.513;1" repeatCount="indefinite"/>
      </feMerge>

      <feMerge>
        <feMergeNode in="SourceGraphic"/>
        <feMergeNode in="merge1"/>
        <feMergeNode in="merge2"/>
      </feMerge>
    </filter>
  </defs>

  <text x="4%" y="40" font-size="40" font-family="'Share Tech Mono', sans-serif">
    <tspan x="4%" dy="0" fill="white" filter="url(#filter)">Hello,</tspan>
    <tspan x="4%" dy="1.2em" fill="white" filter="url(#filter)">Transcendence!</tspan>
  </text>
</svg>

  			<div class="absolute top-0 left-0 h-full w-[5px] bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]  "></div>
			<div class="absolute top-0 right-0 h-full w-[5px] bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)] "></div>

		</div>


	</div>
	<div class="backdrop-blur-md bg-[linear-gradient(45deg,_rgba(230,21,242,0.1),_rgba(26,222,249,0.1))]   w-full xl:w-[40vw] h-full p-[5px]">
		<div id="session-box" class="relative flex justify-center items-center bg-[linear-gradient(45deg,_rgba(230,21,242,0.1),_rgba(26,222,249,0.1))] pb-6 overflow-hidden h-full w-full">

		</div>
	</div>
</div>

`;
  }

  protected initEvents(): void {
    if (!this.element) return;
    const session = this.element.querySelector('#session-box');
    if (session) {
      const loginComponent = new LogInComponent({
        onCreateAccount: () => {
          session.innerHTML = '';
          const createAccount = new CreateAccountComponent({
            onSignIn: () => {
              session.innerHTML = '';
              session.appendChild(loginComponent.render());

            }});
          session.appendChild(createAccount.render());

        },
        onRecoverPassword: () => {
          session.innerHTML = '';
          const recoverPassword = new RecoverPasswordComponent({
            onSignIn: () => {

              session.innerHTML = '';
              session.appendChild(loginComponent.render());

            }
          });
          session.appendChild(recoverPassword.render());
        }
      });
      session?.appendChild(loginComponent.render());
    }

  }

}
