import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, collection, getDocs, getDoc, query, orderBy, documentId, serverTimestamp, updateDoc } from 'firebase/firestore';

const SPOTIFY_SEARCH_URL = "https://us-central1-marlove-9b442.cloudfunctions.net/spotifySearch";

const firebaseConfig = {
    apiKey: "AIzaSyBZfy3js-AuLcw1jmnTRjWVCQkmv1pUtSU",
    authDomain: "marlove-9b442.firebaseapp.com",
    projectId: "marlove-9b442",
    storageBucket: "marlove-9b442.firebasestorage.app",
    messagingSenderId: "148329779594",
    appId: "1:148329779594:web:8fde6c7449d0ce6dce7873",
    measurementId: "G-CFRRZKFDQL"
};

let auth = null;
let db = null;
let coupleId = null;
let myName = null;
let MY_UID = null;
let PARTNER_UID = null;
let LEFT_NAME = null;
let RIGHT_NAME = null;
let GENRE = null;
let feelingTemp = null;
let ratingTemp = 0;

let descriptionsGlobal = [];
let data = [];
let dbData = [];
let elements = [];
const swipers = {};

function resetTimeline() {
    descriptionsGlobal = [];
    data = [];
    dbData = [];
    elements = [];
    const containerSection = document.getElementById("slides_section");
    while (containerSection.firstChild) {
        containerSection.removeChild(containerSection.firstChild);
    }
    MY_UID = null;
    PARTNER_UID = null;
    LEFT_NAME = null;
    RIGHT_NAME = null;
    coupleId = null;
    GENRE = null;
}

function showAuthView() {
    document.getElementById("authView")?.classList.remove("hidden");
    document.getElementById("appView")?.classList.add("hidden");
    document.getElementById("slides_section")?.classList.add("hidden");
}

function showAppView() {
    document.getElementById("authView")?.classList.add("hidden");
    document.getElementById("appView")?.classList.remove("hidden");
    document.getElementById("slides_section")?.classList.remove("hidden");
}

function showLoader() {
    document.getElementById("loader")?.classList.remove("hidden");
}

function hideLoader() {
    document.getElementById("loader")?.classList.add("hidden");
}

function setLoginError(msg) {
    const el = document.getElementById("loginError");
    if (!el) return;
    if (!msg) {
        el.classList.add("hidden");
        el.textContent = "";
    } else {
        el.classList.remove("hidden");
        el.textContent = msg;
    }
}

function setLogOutButton() {
    const btnLogout = document.getElementById("btnLogout");
    btnLogout?.addEventListener("click", async () => {
        try {
            await signOut(auth);
            // onAuthStateChanged se encargará de volver al login
        } catch (e) {
            console.error(e);
            alert("No se pudo cerrar sesión.");
        }
    });
}

function setupAuthUI() {
    const btnLogin = document.getElementById("btnLogin");


    btnLogin?.addEventListener("click", async () => {
        setLoginError(null);

        const email = document.getElementById("loginEmail")?.value?.trim();
        const password = document.getElementById("loginPassword")?.value;

        if (!email || !password) {
            setLoginError("Completa email y contraseña.");
            return;
        }

        try {
            showLoader();
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged se encargará de entrar al app view e iniciar timeline
        } catch (e) {
            console.error(e);
            setLoginError("No se pudo iniciar sesión. Revisa credenciales.");
            hideLoader();
        }
    });
}


function setBackgroundInitial() {
    let backgroundinitial = document.getElementById("container0");
    const min = 1;
    const max = 6;
    const random_number = Math.floor(Math.random() * (max - min + 1)) + min;
    backgroundinitial.style.backgroundImage = `url(assets/img/hero${random_number}.jpg)`;
    backgroundinitial.style.backgroundPosition = "center";
}

function buildFirstPagination() {
    data.forEach(containerData => {
        const containerId = `container${containerData.id}`;
        const swiperSelector = `#${containerId} .swiper`;

        // Initialize a new Swiper instance for each container
        const timelineSwiper = new Swiper(swiperSelector, {
            direction: 'horizontal',
            loop: false,
            speed: 1600,
            pagination: {
                el: '.swiper-pagination',
                type: 'bullets',
                renderBullet: function (index, className) {
                    //console.log("Rendering index: ", index);
                    //console.log(containerData.slides[index]);
                    const number = containerData.slides[index].index;
                    return `<span class="${className}">${number}</span>`;
                },
                clickable: true
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            initialSlide: 5,
            breakpoints: {
                768: {
                    direction: 'horizontal',
                }
            }
        });

        swipers[containerId] = timelineSwiper;
    });
}

function setAllCarouselItems() {

    let carouselItemHtml1 = `<div
    class="carousel-item h-full max-h-fit flex justify-center ">
    <img
        src=`;
    let carouselItemHtml2 = `>
    </div>`;

    const finalArray = [];

    for (let i = 1; i <= 15; i++) {
        let carousel = document.getElementById("carousel" + i);
        const subArray = imagesUrls.filter(url => url.includes(`/img/${i - 1}/`));
        finalArray.push(subArray);
        for (var j = 0; j < finalArray[i - 1].length; j++) {
            carousel.innerHTML += carouselItemHtml1 + subArray[j] + carouselItemHtml2;
        }
    }

}

function initializeFirestore() {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}

async function readCoupleId() {
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (userDoc.exists()) {
        coupleId = userDoc.data().activeCoupleId;
        myName = userDoc.data().displayName;
        console.log("Couple ID: ", coupleId);
        return true;
    } else {
        console.error("No user document found for UID: ", auth.currentUser.uid);
        return false;
    }
}

const getFirebaseDocs = async (db) => {
    const coll = collection(db, "couples", coupleId, "moments");
    const reading = await getDocs(query(coll, orderBy("momentId", "asc")));
    return reading;
}

const getCoupleDocs = async (db) => {
    const coupleRef = doc(db, "couples", coupleId);
    const coupleData = await getDoc(coupleRef);
    return coupleData;
}

function logicViewModal(element) {
    const id = Number(element.dataset.id);
    const user = element.dataset.user;

    let modal = document.getElementById("descriptionModal");
    let modalTitle = document.getElementById("modalUsername");
    let modalDescription = document.getElementById("modalDescription");
    let modalUserNameFeeling = document.getElementById("modalUserNameFeeling");
    let modalFeeling = document.getElementById("modalFeeling");

    const descriptionData = descriptionsGlobal.find(d => d.momentId === id && d.descriptions[user] != null);
    if (descriptionData != null) {
        modalTitle.textContent = `${user}:`;
        modalDescription.textContent = descriptionData.descriptions[user];
        modalUserNameFeeling.textContent = `${user.charAt(0).toUpperCase() + user.slice(1)} se sintió:`;
        modalFeeling.textContent = element.dataset.feeling ?? "Sin feeling registrado";

        const v = String(descriptionData.ratings[user]);
        const target = document.querySelector(`input[name="rating-modal"][value="${v}"]`);
        if (target) target.checked = true;

    }

    document.getElementById("editMoment")?.setAttribute("data-momentId", id);
    if (element.dataset.useruid === MY_UID) {
        document.getElementById("editMoment").classList.remove("hidden");
    } else {
        document.getElementById("editMoment").classList.add("hidden");
    }

    modal.showModal();
}

function logicRegisterModal(element) {
    var modal = document.getElementById("registerMomentModal");
    const id = Number(element.dataset.id);
    document.getElementById("registerMomentId").value = id;
    fillFeelingSelect(GENRE);
    document.getElementById("registerModalActionText").textContent = "Escribir reseña";
    document.getElementById("saveRegisterMomentBtn").dataset.action = "add";
    modal.showModal();
}

function listenerRegisterReviewBtn() {
    document
        .getElementById("saveRegisterMomentBtn")
        .addEventListener("click", async () => {

            var modal = document.getElementById("registerMomentModal");
            modal.close();
            showLoader();

            const momentId = document.getElementById("registerMomentId").value;

            var action = document.getElementById("saveRegisterMomentBtn").dataset.action;

            if (action === "edit") {
                document.getElementById("descriptionModal").close();
                await saveMomentParticipant(momentId, false);
            } else {
                await saveMomentParticipant(momentId);
            }

            reRenderSlide(momentId, feelingTemp, ratingTemp);

            hideLoader();

        });

    document.getElementById("editMoment").addEventListener("click", async () => {
        var modal = document.getElementById("registerMomentModal");
        const id = Number(document.getElementById("editMoment").dataset.momentid);
        document.getElementById("registerMomentId").value = id;
        var currentDescription = document.getElementById("modalDescription").textContent;
        var currentFeeling = document.getElementById("modalFeeling").textContent;
        fillFeelingSelect(GENRE, currentFeeling);
        var currentModalRating = document.querySelector(`input[name="rating-modal"]:checked`)?.value;
        setRating("registermodal", currentModalRating);
        document.getElementById("registerMomentText").value = currentDescription;
        document.getElementById("registerModalActionText").textContent = "Editar reseña";
        document.getElementById("saveRegisterMomentBtn").dataset.action = "edit";
        modal.showModal();
    });
}

function reRenderSlide(momentId, feeling, rating) {
    var rightSideHtml = document.getElementById(`side${myName.toLowerCase()}${momentId}`);
    if (rightSideHtml) {
        rightSideHtml.outerHTML = renderSide(myName.toLowerCase(), randInt(1, 3), feeling, momentId, MY_UID);
    }

    let currentRate = descriptionsGlobal.find(d => d.momentId === Number(momentId))?.ratings[RIGHT_NAME.toLowerCase()] ?? undefined;
    let newRate = currentRate !== undefined ? (Number(currentRate) + Number(rating)) / 2 : rating;

    setRating(momentId, newRate);
    document.addEventListener("click", (e) => {
        if (e.target && e.target.matches(`[data-action="viewComment"][data-id="${momentId}"]`)) {
            logicViewModal(e.target);
        }
    });

}

function getRegisterMomentData() {

    const description = document.getElementById("registerMomentText").value.trim();

    const feeling = document.getElementById("registerMomentFeeling").value;

    const ratingChecked = document.querySelector('input[name="rating-registermodal"]:checked');
    const rating = ratingChecked ? Number(ratingChecked.value) : 0;

    return {
        description,
        feeling,
        rating
    };
}

async function saveMomentParticipant(momentId, justSaveParameter = true) {

    var uid = auth.currentUser.uid;

    const { description, feeling, rating } = getRegisterMomentData();
    feelingTemp = feeling;
    ratingTemp = rating;

    const momentRef = doc(db, "couples", coupleId, "moments", String(momentId));

    let data = {};

    if (justSaveParameter) {
        data = {
            [`participants.${uid}`]: {
                name: myName || "User",
                description: description,
                feeling: feeling,
                rating: rating,
                createdAt: serverTimestamp()
            }
        };
    } else {
        data = {
            [`participants.${uid}`]: {
                name: myName || "User",
                description: description,
                feeling: feeling,
                rating: rating,
                updatedAt: serverTimestamp()
            }
        };
    }

    await updateDoc(momentRef, data);
    updateDescriptionsGlobal(momentId, myName.toLowerCase(), description, rating);

    console.log("Momento guardado correctamente");//TODO MANEJAR TOAST

}

function updateDescriptionsGlobal(momentId, userName, description, rating) {
    const moment = descriptionsGlobal.find(item => Number(item.momentId) === Number(momentId));

    if (!moment) {
        descriptionsGlobal.push({
            momentId: Number(momentId),
            descriptions: {
                [userName]: description
            },
            ratings: {
                [userName]: rating
            }
        });
        return;
    }

    if (!moment.descriptions) {
        moment.descriptions = {};
    }

    if (!moment.ratings) {
        moment.ratings = {};
    }

    moment.descriptions[userName] = description;
    moment.ratings[userName] = rating;

    if (Object.prototype.hasOwnProperty.call(moment.descriptions, "undefined")) {
        delete moment.descriptions.undefined;
    }

    if (Object.prototype.hasOwnProperty.call(moment.ratings, "undefined")) {
        delete moment.ratings.undefined;
    }
}

function fillFeelingSelect(genre, currentFeeling = null) {

    const select = document.getElementById("registerMomentFeeling");
    select.innerHTML = "";

    const feelings = genre === "man" ? feelingsMan : feelingsWoman;

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Selecciona un feeling";
    defaultOption.disabled = true;

    if (!currentFeeling) {
        defaultOption.selected = true;
    }

    select.appendChild(defaultOption);

    feelings.forEach(feeling => {

        const option = document.createElement("option");
        option.value = feeling;
        option.textContent = feeling;

        if (currentFeeling && feeling === currentFeeling) {
            option.selected = true;
        }

        select.appendChild(option);

    });

}

function renderSongHtml() {
    return `<div class="tooltip" data-tip="Abrir en Spotify">
                            <a class="btn btn-ghost btn-xs rounded-full" href="SPOTIFY_URL" target="_blank"
                                rel="noreferrer">
                                <span class="opacity-90">🎵</span>
                                <span>Nuestra aflicción</span>
                                <span class="opacity-60">— Pxndx</span>
                            </a>
                        </div>`;
}

function renderIntimacy(initial_index, sex) {
    return `
    <div class="tooltip" data-tip="Momentos íntimos ese día" id="intimacy${initial_index}">
                            <span class="badge badge-ghost badge-lg rounded-full">
                                ❤️ × ${sex}
                            </span>
                        </div>`;
}

function renderSide(name, avatarRand, feeling, initial_index, sideUid) {
    return `
    <div class="flex flex-col relative cursor-pointer" data-id="${initial_index}" data-feeling="${feeling}" data-user="${name}" data-action="viewComment" data-useruid="${sideUid}" id="side${name}${initial_index}">
        <div class="avatar mx-auto transition-transform duration-300 hover:scale-110">
            <div class="ring-secondary ring-offset-base-100 w-24 rounded-full ring-2 ring-offset-2">
                <img id="avatar${name}${initial_index}" src="assets/img/avatars/${name}${avatarRand}.jpg" />
            </div>
        </div>
        <div class="heartbeat absolute -bottom-5 left-1/2 -translate-x-1/2 badge bg-gray-900 text-[8px] px-1"
            id="emotion${name}${initial_index}">
            ${feeling ?? ""}
        </div>
    </div>`;
}

function renderPlaceholderSide(name, avatarRand, initial_index, myown, sideUid) {

    if (myown) {

        return `
            <div class="group flex flex-col relative cursor-pointer opacity-80 hover:opacity-100"
                data-id="${initial_index}" data-user="${name}" data-action="noComment" data-useruid="${sideUid}" id="side${name}${initial_index}">
                
                <div class="avatar mx-auto transition-transform duration-300 group-hover:scale-105">
                <div class="ring-base-300 ring-offset-base-100 w-24 rounded-full ring-2 ring-offset-2">
                    <img id="avatar${name}${initial_index}"
                        class="grayscale contrast-75"
                        src="assets/img/avatars/${name}${avatarRand}.jpg" />
                </div>
                </div>

                <button type="button"
                class="absolute -bottom-5 left-1/2 -translate-x-1/2 badge badge-outline bg-gray-900 text-[10px] px-2 gap-1"
                data-id="${initial_index}" data-user="${name}" data-action="noComment">
                <span class="text-[8px]">Se espera review de ${name.charAt(0).toUpperCase() + name.slice(1)} </span>
                </button>

            </div>`;

    } else {

        return `
            <div class="group flex flex-col relative cursor-pointer opacity-80 hover:opacity-100"
                data-id="${initial_index}" data-user="${name}" data-action="addComment" data-useruid="${sideUid}" id="side${name}${initial_index}">
                
                <div class="avatar mx-auto transition-transform duration-300 group-hover:scale-105">
                <div class="ring-base-300 ring-offset-base-100 w-24 rounded-full ring-2 ring-offset-2">
                    <img id="avatar${name}${initial_index}"
                        class="grayscale contrast-75"
                        src="assets/img/avatars/${name}${avatarRand}.jpg" />
                </div>
                </div>

                <button type="button"
                class="absolute -bottom-5 left-1/2 -translate-x-1/2 badge badge-outline bg-gray-900 text-[10px] px-2 gap-1"
                data-id="${initial_index}" data-user="${name}" data-action="addComment"
                aria-label="Agregar comentario">
                <span class="text-lg leading-none">+</span>
                <span>Agregar</span>
                </button>

            </div>`;
    }
}

function renderRating(initial_index) {
    return `<div class="rating rating-sm rating-half">
                <input type="radio" disabled name="rating-${initial_index}" class="rating-hidden" />
                <input type="radio" disabled name="rating-${initial_index}" value="0.5" class="mask mask-star-2 mask-half-1 bg-orange-400" />
                <input type="radio" disabled name="rating-${initial_index}" value="1"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
                <input type="radio" disabled name="rating-${initial_index}" value="1.5" class="mask mask-star-2 mask-half-1 bg-orange-400" />
                <input type="radio" disabled name="rating-${initial_index}" value="2"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
                <input type="radio" disabled name="rating-${initial_index}" value="2.5" class="mask mask-star-2 mask-half-1 bg-orange-400" />
                <input type="radio" disabled name="rating-${initial_index}" value="3"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
                <input type="radio" disabled name="rating-${initial_index}" value="3.5" class="mask mask-star-2 mask-half-1 bg-orange-400" />
                <input type="radio" disabled name="rating-${initial_index}" value="4"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
                <input type="radio" disabled name="rating-${initial_index}" value="4.5" class="mask mask-star-2 mask-half-1 bg-orange-400" />
                <input type="radio" disabled name="rating-${initial_index}" value="5"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
            </div>`;
}

function setRating(id, value) {
    const v = String(value);
    const target = document.querySelector(`input[name="rating-${id}"][value="${v}"]`);
    if (target) target.checked = true;
}

function formatDate(timestamp) {
    let date = new Date(timestamp.toMillis());
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).replace(/ de \d{4}$/, '');
}

function createContainer(initial_containerid) {

    let contDiv = document.createElement("div");
    contDiv.classList.add("container", "h-screen", "relative");
    contDiv.id = `container${initial_containerid}`;
    let previousDivId = `container${initial_containerid - 1}`;
    console.log("Previous div id: ", previousDivId);
    let slides_container_html = `
                <div class="timeline">
                    <a class="absolute bottom-0 right-0 p-1 m-1 scroll-up"
                        style="z-index:999"
                        data-value="${initial_containerid}">
                        <button type="button" style="background-color: white;"
                            class="relative align-middle select-none font-sans font-medium text-center uppercase transition-all disabled:pointer-events-none w-8 max-w-[40px] h-8 max-h-[40px] text-xs text-blue-gray-900 shadow-md shadow-blue-gray-500/10 hover:shadow-lg hover:shadow-blue-gray-500/20 focus:shadow-none rounded-full">
                            <span
                                class="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2"><svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="1em" viewBox="0 0 384 512"><path
                                        d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"></path></svg></span>
                        </button>
                    </a>
                    <a class="absolute bottom-0 left-0 p-1 m-1 scroll-down"
                        style="z-index:999"
                        data-value="${initial_containerid}">
                        <button type="button" style="background-color: white;"
                            class="relative align-middle select-none font-sans font-medium text-center uppercase transition-all disabled:pointer-events-none w-8 max-w-[40px] h-8 max-h-[40px] text-xs text-blue-gray-900 shadow-md shadow-blue-gray-500/10 hover:shadow-lg hover:shadow-blue-gray-500/20 focus:shadow-none rounded-full">
                            <span
                                class="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2"><svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="1em" viewBox="0 0 384 512"><path
                                        d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z" /></svg></span>
                        </button>
                    </a>
                    <div class="swiper h-screen">
                        <div class="swiper-wrapper" id="swiper_container${initial_containerid}">
                        </div>
                        <div class="swiper-button-prev"></div>
                        <div class="swiper-button-next"></div>
                        <div class="swiper-pagination"></div>
                    </div>
                </div>
        `;
    contDiv.innerHTML = slides_container_html;
    return contDiv;
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addContainersAndSlides(dbDocs) {
    let newConts = Math.ceil(dbDocs / 5);
    let initial_containerid = 1;
    let initial_index = 1;
    let last_indexes = dbDocs % 5;

    let containerSection = document.getElementById("slides_section");

    for (let j = 0; j < newConts; j++) {
        let slides = [];
        let timestamp;
        let titulo;
        let sex = 0;
        let rating1 = 0;
        let rating2 = 0;
        let place;
        let feeling1;
        let feeling2;
        let name1;
        let name2;
        let song;
        let contDiv = createContainer(initial_containerid);
        let previousDivId = `container${initial_containerid - 1}`;
        let referencePrevCont = document.getElementById(previousDivId);
        if (initial_containerid === 1) {
            containerSection.appendChild(contDiv);
        } else {
            containerSection.insertBefore(contDiv, referencePrevCont);
        }

        let swiper_container_div = document.getElementById(`swiper_container${initial_containerid}`);

        let swiperHtml = ``;
        let momentOwnerUid;
        let partnerUidTemp;
        let momentOwnerName;
        let partnerName;

        if (j == newConts - 1 && last_indexes !== 0) {
            for (let x = 0; x < last_indexes; x++) {

                const momentData = elements[j][x];
                console.log("Processing moment id: ", momentData.momentId);
                const p = momentData.participants || {};

                momentOwnerUid = momentData.createdBy;
                partnerUidTemp = momentOwnerUid === MY_UID ? PARTNER_UID : MY_UID;
                momentOwnerName = momentOwnerUid === MY_UID ? LEFT_NAME : RIGHT_NAME;
                partnerName = momentOwnerUid === MY_UID ? RIGHT_NAME : LEFT_NAME;

                const left = p[momentOwnerUid] ?? null;
                const right = p[partnerUidTemp] ?? null;

                timestamp = momentData.timestamp;
                let formattedDateWithoutYear = formatDate(timestamp);

                titulo = momentData.title;
                sex = momentData.sex;
                place = momentData.place;
                song = momentData.song ?? null;
                name1 = left?.name ?? null;
                name1 = name1?.toLowerCase();
                name2 = right?.name ?? null;
                name2 = name2?.toLowerCase();
                rating1 = left?.rating ?? null;
                rating2 = right?.rating ?? null;
                if (rating1 === null) {
                    rating1 = rating2;
                }
                if (rating2 === null) {
                    rating2 = rating1;
                }
                let ratingAverage = (rating1 + rating2) / 2;
                feeling1 = left?.feeling1 ?? null;
                feeling2 = right?.feeling2 ?? null;
                //console.log(momentData);

                let slideDiv = document.createElement("div");
                slideDiv.classList.add("swiper-slide");

                let min = 1;
                let max = 5;
                let avatar1 = 3;
                let avatar2 = 4;
                let random_number = randInt(min, max);
                let randomavatar1 = randInt(1, avatar1);
                let randomavatar2 = randInt(1, avatar2);
                slideDiv.style.backgroundImage = `url(assets/img/back${random_number}.jpg)`;

                let myOwn = MY_UID === momentOwnerUid;

                const showLeft = left != null;
                const showRight = right != null;
                const leftHtml = showLeft ? renderSide(name1, randomavatar1, feeling1, initial_index, momentOwnerUid) : renderPlaceholderSide(momentOwnerName, randomavatar2, initial_index, myOwn, momentOwnerUid);
                const rightHtml = showRight ? renderSide(name2, randomavatar2, feeling2, initial_index, partnerUidTemp) : renderPlaceholderSide(partnerName, randomavatar1, initial_index, myOwn, partnerUidTemp);
                const showSong = song != null;
                const songHtml = showSong ? renderSongHtml() : "";
                const intimacyHtml = sex != 0 ? renderIntimacy(initial_index, sex) : "";
                const editMomentButtonHtml = myOwn === true ? ` <button class="btn btn-ghost btn-xs top-0 left-0 absolute" data-id="${initial_index}" data-action="editMoment">
                        <!-- icon -->
                        <svg xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke-width="1.5" 
                            stroke="currentColor" 
                            class="size-5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                                d="M16.862 4.487l1.687-1.687a2.25 2.25 0 113.182 3.182L10.582 17.13a4.5 4.5 0 01-1.897 1.13l-2.685.895.895-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487z"/>
                        </svg>
                        Editar
                    </button>` : "";

                swiperHtml = `<div class="swiper-slide-content">

                    ${editMomentButtonHtml}

                    <span
                        class="timeline-year">${formattedDateWithoutYear}</span>
                    <h4 class="timeline-title px-6" id="title${initial_index}">${titulo}</h4>
                    <div class="flex my-2 items-center justify-center mx-auto">
                        ${ratingHtml}
                    </div>
                    <div class="mx-4 h-86 carousel carousel-vertical rounded-box" id="carousel${initial_index}"></div>
                    <div class="mt-2 flex flex-wrap flex-col items-center justify-center gap-1">
                        <button class="btn btn-ghost btn-xs rounded-full">
                            <span class="opacity-70">📍</span>
                            <span id="place${initial_index}">${place}</span>
                        </button>
                        ${songHtml}
                        ${intimacyHtml}
                    </div>
                    <div class="my-1 p-3 grid grid-cols-2">
                        ${leftHtml}
                        ${rightHtml}
                    </div>
                </div>`;
                slideDiv.innerHTML = swiperHtml;
                swiper_container_div.appendChild(slideDiv);

                setRating(initial_index, ratingAverage);

                descriptionsGlobal.push({
                    momentId: momentData.momentId, descriptions: { [name1]: left?.description ?? null, [name2]: right?.description ?? null },
                    ratings: { [name1]: left?.rating ?? null, [name2]: right?.rating ?? null }
                });

                var ind = { index: initial_index };
                slides.push(ind);
                initial_index++;
            }
        } else {
            for (let x = 0; x < 5; x++) {
                const momentData = elements[j][x];
                console.log("Processing moment id: ", momentData.momentId);
                const p = momentData.participants || {};

                momentOwnerUid = momentData.createdBy;
                partnerUidTemp = momentOwnerUid === MY_UID ? PARTNER_UID : MY_UID;
                momentOwnerName = momentOwnerUid === MY_UID ? LEFT_NAME : RIGHT_NAME;
                partnerName = momentOwnerUid === MY_UID ? RIGHT_NAME : LEFT_NAME;

                const left = p[momentOwnerUid] ?? null;
                const right = p[partnerUidTemp] ?? null;

                timestamp = momentData.timestamp;
                let formattedDateWithoutYear = formatDate(timestamp);

                titulo = momentData.title;
                sex = momentData.sex;
                place = momentData.place;
                song = momentData.song ?? null;
                name1 = left?.name ?? null;
                name1 = name1?.toLowerCase();
                name2 = right?.name ?? null;
                name2 = name2?.toLowerCase();
                rating1 = left?.rating ?? null;
                rating2 = right?.rating ?? null;
                if (rating1 === null) {
                    rating1 = rating2;
                }
                if (rating2 === null) {
                    rating2 = rating1;
                }
                let ratingAverage = (rating1 + rating2) / 2;
                feeling1 = left?.feeling ?? null;
                feeling2 = right?.feeling ?? null;
                //console.log(momentData);

                let slideDiv = document.createElement("div");
                slideDiv.classList.add("swiper-slide");

                let min = 1;
                let max = 5;
                let avatar1 = 3;
                let avatar2 = 4;
                let random_number = randInt(min, max);
                let randomavatar1 = randInt(1, avatar1);
                let randomavatar2 = randInt(1, avatar2);
                slideDiv.style.backgroundImage = `url(assets/img/back${random_number}.jpg)`;

                let myOwn = MY_UID === momentOwnerUid;

                const showLeft = left != null;
                const showRight = right != null;
                const leftHtml = showLeft ? renderSide(name1, randomavatar1, feeling1, initial_index, momentOwnerUid) : renderPlaceholderSide(momentOwnerName, randomavatar2, initial_index, myOwn, momentOwnerUid);
                const rightHtml = showRight ? renderSide(name2, randomavatar2, feeling2, initial_index, partnerUidTemp) : renderPlaceholderSide(partnerName, randomavatar1, initial_index, myOwn, partnerUidTemp);
                const showSong = song != null;
                const songHtml = showSong ? renderSongHtml() : "";
                const intimacyHtml = sex != 0 ? renderIntimacy(initial_index, sex) : "";
                const ratingHtml = renderRating(initial_index);
                const editMomentButtonHtml = myOwn === true ? ` <button class="btn btn-ghost btn-xs top-0 left-0 absolute" data-id="${initial_index}" data-action="editMoment">
                        <!-- icon -->
                        <svg xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke-width="1.5" 
                            stroke="currentColor" 
                            class="size-5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                                d="M16.862 4.487l1.687-1.687a2.25 2.25 0 113.182 3.182L10.582 17.13a4.5 4.5 0 01-1.897 1.13l-2.685.895.895-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487z"/>
                        </svg>
                        Editar
                    </button>` : "";

                swiperHtml = `<div class="swiper-slide-content">

                    ${editMomentButtonHtml}

                    <span
                        class="timeline-year">${formattedDateWithoutYear}</span>
                    <h4 class="timeline-title px-6" id="title${initial_index}">${titulo}</h4>
                    <div class="flex my-2 items-center justify-center mx-auto">
                        ${ratingHtml}
                    </div>
                    <div class="mx-4 h-86 carousel carousel-vertical rounded-box" id="carousel${initial_index}"></div>
                    <div class="mt-2 flex flex-wrap flex-col items-center justify-center gap-1">
                        <button class="btn btn-ghost btn-xs rounded-full">
                            <span class="opacity-70">📍</span>
                            <span id="place${initial_index}">${place}</span>
                        </button>
                        ${songHtml}
                        ${intimacyHtml}
                    </div>
                    <div class="my-1 p-3 grid grid-cols-2">
                        ${leftHtml}
                        ${rightHtml}
                    </div>
                </div>`;

                slideDiv.innerHTML = swiperHtml;
                swiper_container_div.appendChild(slideDiv);
                var ind = { index: initial_index };
                setRating(initial_index, ratingAverage);
                descriptionsGlobal.push({
                    momentId: momentData.momentId, descriptions: { [name1]: left?.description ?? null, [name2]: right?.description ?? null },
                    ratings: { [name1]: left?.rating ?? null, [name2]: right?.rating ?? null }
                });
                slides.push(ind);
                initial_index++;
            }
        }

        var obj = { id: initial_containerid, slides: slides };
        dbData.push(obj);
        initial_containerid++;
    }
}

function buildSecondPagination() {
    dbData.forEach(containerData => {
        const containerId = `container${containerData.id}`;
        const swiperSelector = `#${containerId} .swiper`;

        const timelineSwiper = new Swiper(swiperSelector, {
            direction: 'horizontal',
            loop: false,
            speed: 1600,
            pagination: {
                el: '.swiper-pagination',
                type: 'bullets',
                renderBullet: function (index, className) {
                    //console.log("Rendering index: ", index);
                    //console.log(containerData.slides[index]);
                    const number = containerData.slides[index].index;
                    return `<span class="${className}">${number}</span>`;
                },
                clickable: true
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            initialSlide: 5,
            breakpoints: {
                768: {
                    direction: 'horizontal',
                }
            }
        });
    });
}

function scrollButtonsLogic() {

    document.getElementById("scrollToContainer1").addEventListener('click', function () {
        document.getElementById("container1").scrollIntoView({ behavior: "smooth" });
    })

    let scrollDownElements = document.querySelectorAll('.scroll-down');
    scrollDownElements.forEach(function (element) {
        element.classList.add("opacity-60");
        let dataValue = element.getAttribute('data-value');
        //console.log('Down - Data Value:', dataValue);
        let nextCont = document.getElementById("container" + (parseInt(dataValue) + 1));
        if (nextCont) {
            //console.log("It has next container");
            element.addEventListener('click', function (e) {
                e.preventDefault();
                nextCont.scrollIntoView({ behavior: "smooth" });
            });
        } else {
            element.classList.add("invisible");
        }
    });

    let scrollUpElements = document.querySelectorAll('.scroll-up');
    scrollUpElements.forEach(function (element) {
        element.classList.add("opacity-60");
        let dataValue = element.getAttribute('data-value');
        //console.log('Up - Data Value:', dataValue);
        let prevCont = document.getElementById("container" + (dataValue - 1));
        if (prevCont) {
            //console.log("It has previous container");
            element.addEventListener('click', function (e) {
                e.preventDefault();
                prevCont.scrollIntoView({ behavior: "smooth" });
            });
        } else {
            element.classList.add("invisible");
        }
    });
}

function firstMomentLogic() {
    let firstMomentBtn = document.getElementById("scrollToContainer1");
    firstMomentBtn.addEventListener('click', function () {
        swipers["container1"].slideTo(0, 1600);
    })
}

function listenerModal() {
    document.addEventListener("click", function (event) {
        const element = event.target.closest("[data-id][data-user][data-action]:not([data-action='noComment'])");
        if (!element) return;

        const id = element.dataset.id;
        const user = element.dataset.user;
        const action = element.dataset.action;

        if (action === "viewComment") {
            logicViewModal(element);
        }

        if (action === "addComment") {
            logicRegisterModal(element);
        }

    });
}

async function initTimeLine() {

    startCountdown("2026-01-15T16:17:00");

    setBackgroundInitial();

    const [coupleDocs, collectionDocs] = await Promise.all([
        getCoupleDocs(db),
        getFirebaseDocs(db)
    ]);

    console.log("Couple docs: ", coupleDocs.data());


    PARTNER_UID = coupleDocs.data().members.find(m => m !== MY_UID);
    LEFT_NAME = coupleDocs.data().displayNames[MY_UID].toLowerCase();
    RIGHT_NAME = coupleDocs.data().displayNames[PARTNER_UID].toLowerCase();
    GENRE = coupleDocs.data().genres[MY_UID];

    console.log("Left name: ", LEFT_NAME);
    console.log("Right name: ", RIGHT_NAME);

    //Convert to array
    const dataArray = collectionDocs.docs.map(doc => doc.data());
    for (let i = 0; i < dataArray.length; i += 5) {
        elements.push(dataArray.slice(i, i + 5));
    }

    let dbDocs = collectionDocs.size;

    data = elements.map((group, idx) => ({
        id: idx + 1,
        slides: group
            // por si acaso alguno viniera sin momentId (no debería), lo filtramos
            .filter(d => d?.momentId != null)
            // y lo convertimos al formato { index: momentId }
            .map(d => ({ index: d.momentId }))
    }));

    addContainersAndSlides(dbDocs);

    setAllCarouselItems();

    buildFirstPagination();

    console.log("Descriptions global: ", descriptionsGlobal);

    scrollButtonsLogic();
    firstMomentLogic();
    listenerModal();
    listenerRegisterReviewBtn();
    setLogOutButton();
    saveNewMomentLogic();
}

function watchAuthState() {
    onAuthStateChanged(auth, async (user) => {
        showLoader();
        if (user) {
            MY_UID = auth.currentUser.uid;
            var coupleFound = await readCoupleId();
            if (!coupleFound) {
                hideLoader();
                setLoginError("No se encontró una pareja asociada a este usuario.");
                showAuthView();
            } else {
                hideLoader();
                showAppView();
                await initTimeLine();
            }
        } else {
            hideLoader();
            resetTimeline();
            showAuthView();
        }
    });
}

document.addEventListener("DOMContentLoaded", async function () {

    initializeFirestore();

    setupAuthUI();
    watchAuthState();

});

function startCountdown(targetDateStr) {
    const targetDate = new Date(targetDateStr).getTime();
    console.log("Target date (ms): ", targetDate);

    const daysEl = document.getElementById("countdays");
    const hoursEl = document.getElementById("counthours");
    const minutesEl = document.getElementById("countminutes");
    const secondsEl = document.getElementById("countseconds");

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    const interval = setInterval(() => {

        const now = Date.now();

        const distance = now - targetDate;

        if (distance <= 0) {
            clearInterval(interval);
            [daysEl, hoursEl, minutesEl, secondsEl].forEach(el => {
                el.textContent = 0;
                el.style.setProperty("--value", 0);
            });
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((distance / (1000 * 60)) % 60);
        const seconds = Math.floor((distance / 1000) % 60);

        const vals = [days, hours, minutes, seconds];
        const els = [daysEl, hoursEl, minutesEl, secondsEl];

        for (let i = 0; i < els.length; i++) {
            els[i].textContent = vals[i];
            els[i].style.setProperty("--value", vals[i]);
        }
    }, 1000);
}

const imagesUrls = [
    "assets/img/0/IMG-20260115-WA0177.jpg",
    "assets/img/1/IMG-20260118-WA0024.jpg",
    "assets/img/1/IMG-20260118-WA0106.jpg",
    "assets/img/1/IMG-20260118-WA0108.jpg",
    "assets/img/10/IMG_9024.gif",
    "assets/img/11/20260211_211913.jpg",
    "assets/img/11/9fed7cd7-a7c1-4938-b3b2-0c54d1becfaa-copied-media~2.jpg",
    "assets/img/11/IMG_9087.jpg",
    "assets/img/11/IMG_9091.jpg",
    "assets/img/11/IMG_9094.jpg",
    "assets/img/11/IMG_9099.jpg",
    "assets/img/12/20260214_230711.jpg",
    "assets/img/12/IMG_9246.jpg",
    "assets/img/12/IMG_9265.jpg",
    "assets/img/13/IMG_9355.jpg",
    "assets/img/14/20260221_031519.jpg",
    "assets/img/15/20260222_171437.jpg",
    "assets/img/2/20260122_224946.jpg",
    "assets/img/2/IMG_8480.jpg",
    "assets/img/3/20260124_183549.jpg",
    "assets/img/3/20260125_002820.jpg",
    "assets/img/3/20260125_110053.jpg",
    "assets/img/4/IMG_8573.jpg",
    "assets/img/4/IMG_85822.gif",
    "assets/img/5/IMG-20260129-WA0022.jpg",
    "assets/img/5/IMG_8639.jpg",
    "assets/img/6/20260130_194929.jpg",
    "assets/img/7/IMG_8882.gif",
    "assets/img/8/IMG_8961.jpg",
    "assets/img/9/IMG_8966.gif"
]

const feelingsMan = [
    "Feliz 😄",
    "Enamorado ❤️",
    "Orgulloso 😌",
    "Agradecido 🙏",
    "Emocionado 🤩",
    "Tranquilo 😌",
    "Nervioso 😅",
    "Sorprendido 😲",
    "Melancólico 🥹"
];

const feelingsWoman = [
    "Feliz 😊",
    "Enamorada ❤️",
    "Agradecida 🙏",
    "Emocionada 🤩",
    "Tranquila 😌",
    "Nerviosa 😅",
    "Ilusionada ✨",
    "Sorprendida 😲",
    "Melancólica 🥹"
];

// Búsqueda Spotify dinámica
function updateSpotifyLink() {
    const spotifySearchBtn = document.getElementById("spotifySearchBtn");
    const query = momentSong.value.trim();
    const spotifyUrl = query
        ? `https://open.spotify.com/search/${encodeURIComponent(query)}`
        : "https://open.spotify.com/search";

    spotifySearchBtn.href = spotifyUrl;
}

async function searchSpotifyTracks(query) {
    const response = await fetch(`${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
        throw new Error("Error buscando canciones en Spotify");
    }

    return await response.json();
}

function escapeHtml(text) {
    return String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showSpotifyResults() {
    const spotifyResults = document.getElementById("spotifyResults");
    spotifyResults.classList.remove("hidden");
}

function hideSpotifyResults() {
    const spotifyResults = document.getElementById("spotifyResults");
    spotifyResults.classList.add("hidden");
    spotifyResults.innerHTML = "";
}

function clearSpotifySelection() {
    const momentSongId = document.getElementById("momentSongId");
    const momentSongName = document.getElementById("momentSongName");
    const momentSongArtist = document.getElementById("momentSongArtist");
    const momentSongImage = document.getElementById("momentSongImage");
    const momentSongUrl = document.getElementById("momentSongUrl");
    const spotifySelected = document.getElementById("spotifySelected");
    const spotifySelectedImage = document.getElementById("spotifySelectedImage");
    const spotifySelectedName = document.getElementById("spotifySelectedName");
    const spotifySelectedArtist = document.getElementById("spotifySelectedArtist");
    const spotifySelectedUrl = document.getElementById("spotifySelectedUrl");
    momentSongId.value = "";
    momentSongName.value = "";
    momentSongArtist.value = "";
    momentSongImage.value = "";
    momentSongUrl.value = "";

    spotifySelectedImage.src = "";
    spotifySelectedName.textContent = "";
    spotifySelectedArtist.textContent = "";
    spotifySelectedUrl.href = "#";

    spotifySelected.classList.add("hidden");
}

function setSpotifySelection(track) {
    const momentSongInput = document.getElementById("momentSong");
    const momentSongId = document.getElementById("momentSongId");
    const momentSongName = document.getElementById("momentSongName");
    const momentSongArtist = document.getElementById("momentSongArtist");
    const momentSongImage = document.getElementById("momentSongImage");
    const momentSongUrl = document.getElementById("momentSongUrl");
    const spotifySelected = document.getElementById("spotifySelected");
    const spotifySelectedImage = document.getElementById("spotifySelectedImage");
    const spotifySelectedName = document.getElementById("spotifySelectedName");
    const spotifySelectedArtist = document.getElementById("spotifySelectedArtist");
    const spotifySelectedUrl = document.getElementById("spotifySelectedUrl");
    momentSongId.value = track.id ?? "";
    momentSongName.value = track.name ?? "";
    momentSongArtist.value = track.artist ?? "";
    momentSongImage.value = track.image ?? "";
    momentSongUrl.value = track.url ?? "";

    momentSongInput.value = `${track.name} — ${track.artist}`;

    spotifySelectedImage.src = track.image || "";
    spotifySelectedName.textContent = track.name || "";
    spotifySelectedArtist.textContent = track.artist || "";
    spotifySelectedUrl.href = track.url || "#";

    spotifySelected.classList.remove("hidden");
    hideSpotifyResults();
}

function renderSpotifyResults(tracks) {

    const spotifyResults = document.getElementById("spotifyResults");


    if (!tracks || tracks.length === 0) {
        spotifyResults.innerHTML = `
            <div class="px-4 py-3 text-sm opacity-70">
                No se encontraron resultados
            </div>
        `;
        showSpotifyResults();
        return;
    }

    spotifyResults.innerHTML = tracks.map((track, index) => `
        <button
            type="button"
            class="spotify-result-item flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-base-200 ${index !== tracks.length - 1 ? "border-b border-base-200" : ""}"
            data-id="${escapeHtml(track.id)}"
            data-name="${escapeHtml(track.name)}"
            data-artist="${escapeHtml(track.artist)}"
            data-image="${escapeHtml(track.image || "")}"
            data-url="${escapeHtml(track.url || "")}"
        >
            <img
                src="${escapeHtml(track.image || "")}"
                alt="${escapeHtml(track.name)}"
                class="h-12 w-12 rounded-xl object-cover shrink-0"
            />

            <div class="min-w-0">
                <p class="truncate font-medium">${escapeHtml(track.name)}</p>
                <p class="truncate text-sm opacity-70">${escapeHtml(track.artist)}</p>
            </div>
        </button>
    `).join("");

    showSpotifyResults();
}

function getLocalDateTimeInputValue(date) {
    const pad = (n) => String(n).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


function logicRegisterIntimacy() {

    let intimacy = 0;
    const MAX_VISIBLE_HEARTS = 6;

    const hearts = document.getElementById("intimacyHearts");
    const count = document.getElementById("intimacyCount");
    const hidden = document.getElementById("intimacyValue");
    const plus = document.getElementById("intimacyPlus");
    const minus = document.getElementById("intimacyMinus");

    function renderQuantityIntimacy(popLast = false) {

        hearts.innerHTML = "";

        if (intimacy === 0) {
            hearts.textContent = "💤";
            count.textContent = "Sin intimidad";
            hidden.value = 0;
            return;
        }

        const visibleHearts = Math.min(intimacy, MAX_VISIBLE_HEARTS);

        for (let i = 0; i < visibleHearts; i++) {

            const heart = document.createElement("span");
            heart.textContent = "❤️";

            if (popLast && i === visibleHearts - 1) {
                heart.classList.add("heart-pop");
            }

            hearts.appendChild(heart);
        }

        count.textContent = "x" + intimacy;
        hidden.value = intimacy;
    }

    plus.onclick = () => {
        intimacy++;
        renderQuantityIntimacy(true);
    };

    minus.onclick = () => {
        if (intimacy > 0) {
            intimacy--;
            renderQuantityIntimacy(false);
        }
    };

    renderQuantityIntimacy();
}

function saveNewMomentLogic() {
    const btnNewMoment = document.getElementById("btnNewMoment");
    const btnChangeImage = document.getElementById("btnChangeImage");
    const imageInput = document.getElementById("momentImageInput");
    const momentModal = document.getElementById("momentModal");
    const momentPreview = document.getElementById("momentPreview");
    const momentImageSrc = document.getElementById("momentImageSrc");
    const momentTimestamp = document.getElementById("momentTimestamp");
    const momentSongId = document.getElementById("momentSongId");
    const btnSaveMoment = document.getElementById("btnSaveMoment");
    const momentForm = document.getElementById("momentForm");
    const spotifyResults = document.getElementById("spotifyResults");
    const momentSongInput = document.getElementById("momentSong");
    const momentSongName = document.getElementById("momentSongName");
    const momentSongArtist = document.getElementById("momentSongArtist");
    const clearSpotifySelectionBtn = document.getElementById("clearSpotifySelection");


    let spotifyDebounceTimer = null;
    let spotifyLastQuery = "";
    let spotifyRequestId = 0;

    // Abrir selector al dar click en registrar
    btnNewMoment.addEventListener("click", () => {
        imageInput.click();
    });

    // Cambiar imagen desde el modal
    btnChangeImage.addEventListener("click", () => {
        imageInput.click();
    });

    // Al seleccionar imagen: preview + abrir modal
    imageInput.addEventListener("change", (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (e) {
            const imageSrc = e.target.result;

            momentPreview.src = imageSrc;
            momentImageSrc.value = imageSrc;

            // si no hay fecha por defecto, ponemos ahora
            if (!momentTimestamp.value) {
                momentTimestamp.value = getLocalDateTimeInputValue(new Date());
            }

            momentModal.showModal();
        };

        reader.readAsDataURL(file);
    });

    momentSongInput.addEventListener("input", () => {
        const query = momentSongInput.value.trim();

        clearTimeout(spotifyDebounceTimer);

        // Si empieza a escribir algo distinto, limpiamos selección previa
        if (
            query !== `${momentSongName.value} — ${momentSongArtist.value}` &&
            momentSongId.value
        ) {
            clearSpotifySelection();
        }

        if (query.length < 2) {
            hideSpotifyResults();
            return;
        }

        spotifyDebounceTimer = setTimeout(async () => {
            const currentRequestId = ++spotifyRequestId;
            spotifyLastQuery = query;

            try {
                spotifyResults.innerHTML = `
                <div class="px-4 py-3 text-sm opacity-70">
                    Buscando...
                </div>
            `;
                showSpotifyResults();

                const tracks = await searchSpotifyTracks(query);

                // Evita pintar resultados viejos si el usuario siguió escribiendo
                if (currentRequestId !== spotifyRequestId) return;
                if (momentSongInput.value.trim() !== spotifyLastQuery) return;

                renderSpotifyResults(tracks);
            } catch (error) {
                console.error(error);

                if (currentRequestId !== spotifyRequestId) return;

                spotifyResults.innerHTML = `
                <div class="px-4 py-3 text-sm text-error">
                    Error buscando canciones
                </div>
            `;
                showSpotifyResults();
            }
        }, 400); // debounce
    });

    /**
     * Seleccionar canción desde dropdown
     */
    spotifyResults.addEventListener("click", (event) => {
        const item = event.target.closest(".spotify-result-item");
        if (!item) return;

        const track = {
            id: item.dataset.id,
            name: item.dataset.name,
            artist: item.dataset.artist,
            image: item.dataset.image,
            url: item.dataset.url
        };

        setSpotifySelection(track);
    });

    /**
 * Botón quitar selección
 */
    clearSpotifySelectionBtn.addEventListener("click", () => {
        clearSpotifySelection();
        momentSongInput.value = "";
        momentSongInput.focus();
    });

    /**
 * Ocultar dropdown al clickear fuera
 */
    document.addEventListener("click", (event) => {
        const clickedInsideSpotify =
            event.target.closest("#momentSong") ||
            event.target.closest("#spotifyResults") ||
            event.target.closest("#spotifySelected");

        if (!clickedInsideSpotify) {
            hideSpotifyResults();
        }
    });

    /**
 * Mostrar dropdown otra vez al enfocar, si hay texto y no hay selección fija
 */
    momentSongInput.addEventListener("focus", () => {
        const query = momentSongInput.value.trim();

        if (query.length >= 2 && !momentSongId.value && spotifyResults.innerHTML.trim() !== "") {
            showSpotifyResults();
        }
    });

    // Guardar
    btnSaveMoment.addEventListener("click", () => {
        if (!momentForm.reportValidity()) return;

        const ratingSelected = document.querySelector('input[name="rating"]:checked');

        const payload = {
            title: document.getElementById("momentTitle").value.trim(),
            place: document.getElementById("momentPlace").value.trim(),
            intimacyCount: Number(document.getElementById("momentIntimacyCount").value || 0),
            song: document.getElementById("momentSong").value.trim(),
            description: document.getElementById("momentDescription").value.trim(),
            rating: ratingSelected ? Number(ratingSelected.value) : null,
            feeling: document.getElementById("momentFeeling").value,
            timestamp: document.getElementById("momentTimestamp").value,
            imageSrc: document.getElementById("momentImageSrc").value
        };

        console.log("Payload del momento:", payload);

        // Aquí luego harías:
        // 1. subir imagen a Firebase Storage
        // 2. obtener URL
        // 3. guardar documento en Firestore con esa URL
        // 4. cerrar modal / limpiar formulario

        momentModal.close();
    });

    logicRegisterIntimacy();
}