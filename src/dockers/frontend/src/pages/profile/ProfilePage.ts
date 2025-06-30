import { Component } from "../../utils/component";
import { ProfileItemComponent } from "../../components/ProfileItem/ProfileItemComponent";
import { ProfileAuthItemComponent } from "../../components/ProfileItem/ProfileIAuthtemComponent";
import { ProfileHeaderItemComponent } from "../../components/ProfileItem/ProfileHeaderItemComponent";
import { ProfileAvatarItemComponent } from "../../components/ProfileItem/ProfileAvatarItemComponent";
import { ToastService } from "../../utils/toast";


export interface UserProfile {
    id: number,
    username: string,
    email: string,
    full_name: string,
    last_name: string,
    favourite_color: string,
    pfp: string,
    country: string,
    bio: string,
    contacts: []
}



export interface DataProfileChange {
    field: string, //IMAGE, DNI...
    value: string | File,
}

export interface DataPasswordChange {
    password: string,
    newPassword: string
}

export class ProfilePage extends Component {
    private fieldToKeyMap: Record<string, string> = {
        Username: "username",
        Email: "email",
        Country: "country",
        Avatar: "avatar_url",
        Color: "favourite_color"
    };

    private items: Map<string, any> = new Map<string, ProfileItemComponent>();
    private userProfile: UserProfile;
    private authItem: ProfileAuthItemComponent | undefined;
    private headerItem: ProfileHeaderItemComponent | undefined;
    constructor() {
        super();
        this.userProfile = {
            id: 12,
            username: "adrian",
            email: "adrianherrerare@yahoo.com",
            full_name: "",
            last_name: "",
            favourite_color: "",
            pfp: "/images/pfp.jpg",
            country: "",
            bio: "",
            contacts: []
        };
        this.template = `
    <div class=" w-screen h-screen flex flex-col justify-center items-center ">
        <div id="profile-lineal-bg" class="animate-expand-from-center w-fit h-fit  flex flex-col overflow-hidden px-[5px] rounded bg-gradient-animate shadow-[0_0_20px_rgba(0,0,0,0.5)] z-50">
            <div id="profile" class="reveal-content bg-[#11162F] flex flex-col w-fit h-fit space-y-4 px-[2.5rem] pb-8 pt-4">
                <!-- Carga los datos del profile: fdp, username, email... -->
                <div class="reveal-content-child relative flex flex-row justify-center items-center"> 
                    <div id="div-username" class="text-white text-lg font-semibold">PERFIL</div>
                </div>
                <div id="div-detail" class="reveal-content-child h-fit w-full flex flex-col space-y-2 " ></div>

                <div class="flex flex-row space-x-4">

                    <button id="profile-exit" 
                        class="ripple bg-transparent border border-white text-white text-sm py-2 px-6 rounded-full hover:bg-white/10 transition">
                        Salir
                    </button>

                    <button id="profile-delete" 
                        class="ripple bg-transparent border border-white text-white text-sm py-2 px-6 rounded-full hover:bg-white/10 transition">
                        Borrar cuenta
                    </button>

                </div>
            </div>
        </div>
    </div>
        `;
    }

    async getUserProfiel(): Promise<UserProfile> {
        const rs = await fetch("/backend/api/profile", {
            method: "GET",
            credentials: "include"
        });
        //TODO: En caso deser un error que muestre un mensaje de no se pudo ver le perfil
        const profile = await rs.json();
        return profile.data as UserProfile;
    }

    protected async initEvents(): Promise<void> {
        if (!this.element) {
            return;
        }
        this.userProfile = await this.getUserProfiel();

        const profile = this.element.querySelector("#profile") as HTMLElement
        const profileExit = this.element.querySelector(`#profile-exit`) as HTMLButtonElement;
        if (profileExit) {
            profileExit.addEventListener('click', async () => {
                await this.exitSession();
            });
        }
        //Los datos cargados seran los adqueridos de la base de datos, de momento somo Manolo
        if (profile) {
            const divImg = this.element.querySelector("#div-img") as HTMLElement
            const divUsername = this.element.querySelector("#div-username") as HTMLElement
            const divDetail = this.element.querySelector("#div-detail") as HTMLElement
            //Cargar los datos del usuario
            this.buildContent();

            setTimeout(() => {
                if (!this.element) return;
                const val = this.element.querySelector(`#profile-lineal-bg`);
                if (val)
                    val.classList.remove('animate-expand-from-center');
            }, 1000);
        }

    }
    async exitSession() {
        const response = await fetch ('/backend/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        if (response.ok) {
            window.location.reload();
        } else {
            ToastService.show("Error al intentar cerrar la sesion", "error");
            
        }
    }

    buildContent() {

        if (!this.element) return;
        const profile = this.element.querySelector('#profile');
        if (!profile) return;
        const divDetail = this.element.querySelector("#div-detail") as HTMLElement
        if (!divDetail) return;

        const avatarItem = new ProfileAvatarItemComponent({
            id: "0",
            field: "Username",
            value: this.userProfile.username,
            position: "uniq",
            classItem: " w-full ",
            avatarType: "image",
            avatar: this.userProfile.pfp,
            hasEdit: true,
            onEdit: (id:string) => {
                this.toggleHiddenItems(id);
            },
            onSave: async (profile: DataProfileChange[], id:string) => {
                await this.updateAvatar(profile[1], async (url) => {
                    this.headerItem?.update({ avatar: "/backend" + url });
                    await this.updateProfile(profile, () => {
                        this.toggleHiddenItems(id);
                        this.headerItem?.update({ value: this.userProfile.username, hasEdit: true });
                    }, () => {

                    });
                }, () => {

                });

            }
        });
        divDetail.appendChild(avatarItem.render());

        this.headerItem = new ProfileHeaderItemComponent({
            id: "1",
            field: "Username",
            value: this.userProfile.username,
            position: "uniq",
            classItem: " w-full ",
            avatarType: "image",
            avatar: this.userProfile.pfp,
            hasEdit: true,
            onEdit: (id:string) => {
                this.toggleHiddenItems(id);
            },
            onSave: async (profile: DataProfileChange[]) => {
                if (profile[0].field === "Username") {
                    await this.updateProfile(profile, () => {
                        this.toggleHiddenItems("1");
                        this.headerItem?.update({ value: this.userProfile.username, hasEdit: true });
                    }, () => {

                    });
                } else {
                    this.toggleHiddenItems("0");
                    this.headerItem?.toggleView("Editar", true);

                }
            }
        });

        divDetail.appendChild(this.headerItem.render());

        const emailItem = new ProfileItemComponent({
            id: "2",
            field: "Email",
            value: this.userProfile.email,
            position: "uniq",
            classItem: " w-full ",
            avatarType: "svg",
            avatar: `<svg class="w-full h-full" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.5098 10.9844C14.5098 9.92351 14.0883 8.9061 13.3382 8.15595C12.5881 7.40581 11.5706 6.98438 10.5098 6.98438C9.4489 6.98438 8.43149 7.40581 7.68134 8.15595C6.9312 8.9061 6.50977 9.92351 6.50977 10.9844C6.50977 12.0452 6.9312 13.0627 7.68134 13.8128C8.43149 14.563 9.4489 14.9844 10.5098 14.9844C11.5706 14.9844 12.5881 14.563 13.3382 13.8128C14.0883 13.0627 14.5098 12.0452 14.5098 10.9844ZM14.5098 10.9844V12.4844C14.5098 13.1474 14.7732 13.7833 15.242 14.2521C15.7108 14.721 16.3467 14.9844 17.0098 14.9844C17.6728 14.9844 18.3087 14.721 18.7775 14.2521C19.2464 13.7833 19.5098 13.1474 19.5098 12.4844V10.9844C19.5098 9.20435 18.9819 7.46429 17.993 5.98425C17.0041 4.5042 15.5985 3.35065 13.9539 2.66946C12.3094 1.98827 10.4998 1.81004 8.75396 2.15731C7.00813 2.50458 5.40448 3.36175 4.14581 4.62042C2.88714 5.87909 2.02997 7.48274 1.6827 9.22857C1.33544 10.9744 1.51367 12.784 2.19485 14.4285C2.87604 16.0731 4.0296 17.4787 5.50964 18.4676C6.98968 19.4565 8.72974 19.9844 10.5098 19.9844C12.09 19.9859 13.6425 19.5705 15.0098 18.7784" stroke="url(#paint0_linear_158_1262)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<defs>
<linearGradient id="paint0_linear_158_1262" x1="2.2395" y1="19.9854" x2="20.6519" y2="4.21828" gradientUnits="userSpaceOnUse">
<stop stop-color="#F00BF2"/>
<stop offset="1" stop-color="#2CD8C2"/>
</linearGradient>
</defs>
</svg>`,
            hasEdit: true,
            onEdit: (id:string) => {
                this.toggleHiddenItems(id);

            },
            onSave: (profile: [DataProfileChange]) => {
                this.updateProfile(profile, () => {
                    this.toggleHiddenItems("2");
                    emailItem?.update({ value: this.userProfile.email });
                }, () => { });

            }
        });
        divDetail.appendChild(emailItem.render());
        this.authItem = new ProfileAuthItemComponent({
            id: "3",
            field: "Password",
            value: "*******",
            position: "uniq",
            classItem: " w-full ",
            avatarType: "svg",
            avatar: `
            <svg class="w-full h-full" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.50977 12.9922V14.9922M3.50977 18.9922H15.5098C16.0402 18.9922 16.5489 18.7815 16.924 18.4064C17.2991 18.0313 17.5098 17.5226 17.5098 16.9922V10.9922C17.5098 10.4618 17.2991 9.95305 16.924 9.57797C16.5489 9.2029 16.0402 8.99219 15.5098 8.99219H3.50977C2.97933 8.99219 2.47062 9.2029 2.09555 9.57797C1.72048 9.95305 1.50977 10.4618 1.50977 10.9922V16.9922C1.50977 17.5226 1.72048 18.0313 2.09555 18.4064C2.47062 18.7815 2.97933 18.9922 3.50977 18.9922ZM13.5098 8.99219V4.99219C13.5098 3.93132 13.0883 2.91391 12.3382 2.16376C11.588 1.41361 10.5706 0.992188 9.50977 0.992188C8.4489 0.992188 7.43148 1.41361 6.68134 2.16376C5.93119 2.91391 5.50977 3.93132 5.50977 4.99219V8.99219H13.5098Z" stroke="url(#paint0_linear_180_2146)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <defs>
                <linearGradient id="paint0_linear_180_2146" x1="2.15841" y1="18.9922" x2="20.1191" y2="5.32008" gradientUnits="userSpaceOnUse">
                <stop stop-color="#F00BF2"/>
                <stop offset="1" stop-color="#2CD8C2"/>
                </linearGradient>
                </defs>
            </svg>

            `,
            hasEdit: true,
            onEdit: (id:string) => {
                console.log("onEdit: ");
                this.toggleHiddenItems(id);
            },
            onSave: (profile: [DataPasswordChange]) => {
                console.log("onSabe: ", profile);
                //TODO: Hacer un fetch put y si llega a ser satisfactorio hacer un toggle
                this.updatePassword(profile,
                    () => {
                        this.toggleHiddenItems("3");
                        this.authItem?.toggleView("Editar", true);
                    }, (msg: string) => {
                        console.log(msg);
                        this.authItem?.showTemporaryPasswordError("current");
                    });
            }
        });
        divDetail.appendChild(this.authItem.render());

        const colorFavItem = new ProfileItemComponent({
            id: "4",
            field: "Color",
            value: this.userProfile.favourite_color,
            position: "uniq",
            classItem: " w-full ",
            avatarType: "card",
            avatarColor: "#FFFF23",
            hasEdit: true,
            onEdit: (id:string) => {
                this.toggleHiddenItems(id);

            },
            onSave: (profile: [DataProfileChange]) => {
                this.updateProfile(profile, () => {
                    this.toggleHiddenItems("4");
                    colorFavItem?.update({ 
                        value: this.userProfile.favourite_color,
                        avatarColor: this.userProfile.favourite_color
                    });
                }, () => { });
            }
        });
        divDetail.appendChild(colorFavItem.render());

        const countryItem = new ProfileItemComponent({
            id: "5",
            field: "Country",
            value: this.userProfile.country,
            position: "uniq",
            classItem: " w-full ",
            avatarType: "svg",
            avatar: `
            <svg class="w-full h-full" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M2.53683 2.64215C3.84965 1.32933 5.63022 0.591797 7.48683 0.591797C9.34344 0.591797 11.124 1.32933 12.4368 2.64215C13.7497 3.95498 14.4872 5.73554 14.4872 7.59215C14.4872 9.44876 13.7497 11.2293 12.4368 12.5422L7.48683 17.4922L2.53683 12.5422C1.88675 11.8921 1.37107 11.1204 1.01924 10.2711C0.667412 9.42178 0.486328 8.51147 0.486328 7.59215C0.486328 6.67284 0.667412 5.76253 1.01924 4.91321C1.37107 4.06388 1.88675 3.29217 2.53683 2.64215ZM7.48683 9.59215C8.01727 9.59215 8.52597 9.38144 8.90105 9.00637C9.27612 8.63129 9.48683 8.12259 9.48683 7.59215C9.48683 7.06172 9.27612 6.55301 8.90105 6.17794C8.52597 5.80287 8.01727 5.59215 7.48683 5.59215C6.9564 5.59215 6.44769 5.80287 6.07262 6.17794C5.69755 6.55301 5.48683 7.06172 5.48683 7.59215C5.48683 8.12259 5.69755 8.63129 6.07262 9.00637C6.44769 9.38144 6.9564 9.59215 7.48683 9.59215Z" fill="url(#paint0_linear_199_1198)"/>
                <defs>
                <linearGradient id="paint0_linear_199_1198" x1="1.05393" y1="17.4922" x2="17.5665" y2="5.77726" gradientUnits="userSpaceOnUse">
                <stop stop-color="#F00BF2"/>
                <stop offset="1" stop-color="#1ADEF9"/>
                </linearGradient>
                </defs>
            </svg>
            `,
            hasEdit: true,
            onEdit: (id:string) => {
                this.toggleHiddenItems(id);
            },
            onSave: (profile: [DataProfileChange]) => {
                this.updateProfile(profile, () => {
                    this.toggleHiddenItems("5");
                    countryItem?.update({ value: this.userProfile.country });
                }, () => { });
            }
        });
        divDetail.appendChild(countryItem.render());
        this.items.set("0", avatarItem);
        this.items.set("1", this.headerItem);
        this.items.set("2", emailItem);
        this.items.set("3", this.authItem);
        this.items.set("4", colorFavItem);
        this.items.set("5", countryItem);

    }

    async updateAvatar(data: DataProfileChange, callBack: (url: string) => void, onError: () => void): Promise<number> {
        const formData = new FormData();
        formData.append('image', data.value);

        try {
            const response = await fetch('/backend/api/upload-avatar', {
                method: 'POST',
                body: formData,
                credentials: "include",
            });
            if (response.ok) {
                const body = await response.json();
                body.url
                callBack(body.url);
            }
            return 1;
        } catch (err) {
            console.error(err);
            onError();
            return 0;
        }
    }

    async updateProfile(profile: DataProfileChange[], callBack: () => void, onError: () => void) {
        const updateDto: Record<string, string | File> = {};
        for (const item of profile) {
            const key = this.fieldToKeyMap[item.field];
            if (key)
                updateDto[key] = item.value;
        }
        const response = await fetch("/backend/api/profile", {
            method: "PUT",
            headers: {
                "accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateDto),
            credentials: "include",
        });
        if (response.status === 200 || response.status === 201) {
            this.userProfile = { ...this.userProfile, ...updateDto };
            console.log(await response.json())
            callBack();
        } else {
            onError();
        }
    }

    async updatePassword(profile: [DataPasswordChange], callBack: () => void, onError: (msg: string) => void) {
        const updateCredential = { currentPassword: profile[0].password, newPassword: profile[0].newPassword };
        const response = await fetch("/backend/api/change-password", {
            method: "PUT",
            headers: {
                "accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateCredential),
            credentials: "include",
        });
        if (response.status === 200 || response.status === 201) {
            callBack();
        } else {
            console.log("status: " + response.status)
            console.log(await response.json())
            onError(response.statusText);
        }

    }

    toggleHiddenItems(id: string) {
        for (const [key, item] of this.items.entries()) {
            if (key !== id && item) {
                item.toggleHidden();
            }
        }

    }
}