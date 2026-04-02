import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, collection, runTransaction, getDocs, setDoc, arrayUnion, Timestamp, getDoc, query, where, orderBy, documentId, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
let storage = null;
let coupleId = null;
let myName = null;
let MY_UID = null;
let PARTNER_UID = null;
let LEFT_NAME = null;
let RIGHT_NAME = null;
let GENRE = null;
let feelingTemp = null;
let ratingTemp = 0;
let intimacyState = 0;
let momentModalMode = "create"; // "create" | "edit"
let editingMomentId = null;
let carouselImgIds = [];

let descriptionsGlobal = [];
let data = [];
let dbData = [];
let elements = [];
const swipers = {};

function deleteTimelineData() {
    descriptionsGlobal = [];
    data = [];
    dbData = [];
    elements = [];
    const containerSection = document.getElementById("slides_section");
    while (containerSection.firstChild) {
        containerSection.removeChild(containerSection.firstChild);
    }

}

function resetLoggedUserData() {
    MY_UID = null;
    PARTNER_UID = null;
    LEFT_NAME = null;
    RIGHT_NAME = null;
    coupleId = null;
    GENRE = null;
    myName = null;
}

function getFirebaseAuthErrorMessage(error) {
    switch (error.code) {
        case "auth/email-already-in-use":
            return "Ese correo ya está registrado.";
        case "auth/invalid-email":
            return "El correo no es válido.";
        case "auth/weak-password":
            return "La contraseña debe tener al menos 6 caracteres.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Correo o contraseña incorrectos.";
        default:
            return "Ocurrió un error. Inténtalo nuevamente.";
    }
}

function showCoupleSetupView() {
    document.getElementById("authView")?.classList.add("hidden");
    document.getElementById("coupleSetupView")?.classList.remove("hidden");
    document.getElementById("appView")?.classList.add("hidden");
}

function userRegister() {
    const registerModal = document.getElementById("registerModal");
    const registerError = document.getElementById("registerError");
    const btnRegister = document.getElementById("btnRegister");

    function openRegisterModal() {
        registerModal.classList.remove("hidden");
        registerModal.classList.add("flex");
        clearRegisterError();
    }

    function closeRegisterModal() {
        registerModal.classList.add("hidden");
        registerModal.classList.remove("flex");
        clearRegisterError();
    }

    function setRegisterError(message) {
        registerError.textContent = message;
        registerError.classList.remove("hidden");
    }

    function clearRegisterError() {
        registerError.textContent = "";
        registerError.classList.add("hidden");
    }

    document.getElementById("btnRegisterOpen")?.addEventListener("click", openRegisterModal);
    document.getElementById("btnCloseRegisterModal")?.addEventListener("click", closeRegisterModal);
    document.getElementById("btnCancelRegister")?.addEventListener("click", closeRegisterModal);

    registerModal?.addEventListener("click", function (e) {
        if (e.target === registerModal) {
            closeRegisterModal();
        }
    });

    btnRegister?.addEventListener("click", async function () {
        btnRegister.disabled = true;
        clearRegisterError();

        console.log("here");

        const displayName = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value.trim();
        const genre = document.getElementById("registerGenre").value;

        if (!displayName) {
            setRegisterError("El nombre es obligatorio.");
            return;
        }

        if (!email) {
            setRegisterError("El email es obligatorio.");
            return;
        }

        if (!password) {
            setRegisterError("La contraseña es obligatoria.");
            return;
        }

        if (!genre) {
            setRegisterError("Debes seleccionar hombre o mujer.");
            return;
        }

        try {
            showLoader();

            const credential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = credential.user.uid;
            console.log("uid", uid);

            await setDoc(doc(db, "users", uid), {
                email,
                displayName,
                genre,
                activeCoupleId: null,
                createdAt: serverTimestamp()
            });

            closeRegisterModal();
        } catch (error) {
            console.log("error catcheado");
            hideLoader();
            setRegisterError(getFirebaseAuthErrorMessage(error));
        } finally {
            btnRegister.disabled = false;
        }
    });
}

async function waitForUserDoc(uid, retries = 10, delayMs = 300) {
    for (let i = 0; i < retries; i++) {
        const snap = await getDoc(doc(db, "users", uid));

        if (snap.exists()) {
            return snap.data();
        }

        await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    return null;
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
    const btnlogout = document.getElementById("btnLogOut");

    btnlogout.addEventListener("click", async () => {
        await signOut(auth);
        location.reload();
    })


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

    userRegister();

    document.getElementById("btnJoinCouple")?.addEventListener("click", async function () {
        const code = document.getElementById("joinCoupleCode").value.trim();
        const errorEl = document.getElementById("joinCoupleError");

        errorEl.classList.add("hidden");
        errorEl.textContent = "";

        if (!code) {
            errorEl.textContent = "Debes ingresar un código.";
            errorEl.classList.remove("hidden");
            return;
        }

        try {
            showLoader();

            const q = query(collection(db, "couples"), where("code", "==", code));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                hideLoader();
                errorEl.textContent = "No se encontró ninguna pareja con ese código.";
                errorEl.classList.remove("hidden");
                return;
            }

            const coupleDoc = querySnapshot.docs[0];
            const coupleIdentificator = coupleDoc.id;
            const coupleData = coupleDoc.data();

            const members = Array.isArray(coupleData.members) ? coupleData.members : [];

            if (members.includes(MY_UID)) {
                await updateDoc(doc(db, "users", MY_UID), {
                    activeCoupleId: coupleIdentificator
                });

                hideLoader();
                location.reload();
                return;
            }

            if (members.length >= 2) {
                hideLoader();
                errorEl.textContent = "Esta pareja ya tiene 2 miembros.";
                errorEl.classList.remove("hidden");
                return;
            }

            await updateDoc(doc(db, "couples", coupleIdentificator), {
                [`displayNames.${MY_UID}`]: myName,
                [`genres.${MY_UID}`]: GENRE,
                members: arrayUnion(MY_UID)
            });

            await updateDoc(doc(db, "users", MY_UID), {
                activeCoupleId: coupleIdentificator
            });

            hideLoader();
            location.reload();
        } catch (error) {
            hideLoader();
            errorEl.textContent = "No se pudo unir a la pareja.";
            errorEl.classList.remove("hidden");
            console.error(error);
        }
    });
}


function setBackgroundInitial() {
    let backgroundinitial = document.getElementById("container0");
    const min = 1;
    const max = 9;
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
    class="carousel-item h-full flex justify-center ">
    <img
        src=`;
    let carouselItemHtml2 = `>
    </div>`;

    const finalArray = [];

    carouselImgIds.forEach(i => {
        console.log("Carousel:", i);
        let carousel = document.getElementById("carousel" + i);
        const subArray = imagesUrls.filter(url => url.includes(`/img/${i - 1}/`));
        finalArray.push(subArray);
        for (var j = 0; j < finalArray[finalArray.length - 1].length; j++) {
            carousel.innerHTML += carouselItemHtml1 + subArray[j] + carouselItemHtml2;
        }
    })
}

function initializeFirestore() {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
}

async function readCoupleId() {
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (userDoc.exists()) {
        myName = userDoc.data().displayName;
        console.log("myName:", myName);
        if (!userDoc.data().activeCoupleId) {
            return false;
        }
        coupleId = userDoc.data().activeCoupleId;
        console.log("Couple ID: ", coupleId);
        return true;
    } else {
        console.error("No user document found for UID: ", auth.currentUser.uid);
        return false;
    }
}

const getFirebaseDocs = async (db) => {
    const coll = collection(db, "couples", coupleId, "moments");
    const reading = await getDocs(query(coll, orderBy("timestamp", "asc")));
    return reading;
}

const getCoupleDocs = async (db) => {
    const coupleRef = doc(db, "couples", coupleId);
    const coupleData = await getDoc(coupleRef);
    return coupleData;
}

function logicViewModal(element) {
    const visualIndex = Number(element.dataset.visualindex);
    const user = element.dataset.user;
    const sourceAvatar = document.getElementById(`avatar${user}${visualIndex}`);

    let modal = document.getElementById("descriptionModal");
    let modalTitle = document.getElementById("modalUsername");
    let modalDescription = document.getElementById("modalDescription");
    let modalUserNameFeeling = document.getElementById("modalUserNameFeeling");
    let modalFeeling = document.getElementById("modalFeeling");
    let modalDateTime = document.getElementById("datetimeDescription");
    let avatarModal = document.getElementById("avatarModal");

    const descriptionData = descriptionsGlobal.find(d => d.visualIndex === visualIndex && d.descriptions[user] != null);
    if (descriptionData != null) {
        modalTitle.textContent = `${user}:`;
        modalDescription.textContent = descriptionData.descriptions[user];
        modalUserNameFeeling.textContent = `${user.charAt(0).toUpperCase() + user.slice(1)} se sintió:`;
        modalFeeling.textContent = element.dataset.feeling ?? "Sin feeling registrado";

        if (descriptionData.timesUpdated && descriptionData.timesUpdated[user]) {
            modalDateTime.textContent = `Actualizado el ${formatFullDate(descriptionData.timesUpdated[user])}`;
        } else if (descriptionData.times && descriptionData.times[user]) {
            modalDateTime.textContent = `Agregado el ${formatFullDate(descriptionData.times[user])}`;
        }

        if (sourceAvatar && avatarModal) {
            avatarModal.src = sourceAvatar.getAttribute("src");
        }


        const v = String(descriptionData.ratings[user]);
        const target = document.querySelector(`input[name="rating-modal"][value="${v}"]`);
        if (target) target.checked = true;

    }

    document.getElementById("editMoment")?.setAttribute("data-visualindex", visualIndex);
    if (element.dataset.useruid === MY_UID) {
        document.getElementById("editMoment").classList.remove("hidden");
    } else {
        document.getElementById("editMoment").classList.add("hidden");
    }

    modal.showModal();
}

function logicRegisterModal(element) {
    var modal = document.getElementById("registerMomentModal");
    const visualIndex = Number(element.dataset.visualindex);
    document.getElementById("registerMomentId").value = visualIndex;
    fillFeelingSelect(GENRE);
    document.getElementById("registerModalActionText").textContent = "Escribir reseña";
    document.getElementById("saveRegisterMomentBtn").dataset.action = "add";
    modal.showModal();
}

function mapMomentId(visualIndex) {
    return descriptionsGlobal.find(d => Number(d.visualIndex) === Number(visualIndex)).momentId;
}

function listenerRegisterReviewBtn() {
    document
        .getElementById("saveRegisterMomentBtn")
        .addEventListener("click", async () => {

            var modal = document.getElementById("registerMomentModal");
            modal.close();
            showLoader();

            const visualIndex = document.getElementById("registerMomentId").value;
            let momentId = mapMomentId(visualIndex);

            var action = document.getElementById("saveRegisterMomentBtn").dataset.action;

            if (action === "edit") {
                document.getElementById("descriptionModal").close();
                await saveMomentParticipant(momentId, false);
            } else {
                await saveMomentParticipant(momentId);
            }

            reRenderSlide(visualIndex, feelingTemp, ratingTemp);

            hideLoader();

        });

    document.getElementById("editMoment").addEventListener("click", async () => {
        var modal = document.getElementById("registerMomentModal");
        const visualIndex = Number(document.getElementById("editMoment").dataset.visualindex);
        document.getElementById("registerMomentId").value = visualIndex;
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

function reRenderSlide(visualIndex, feeling, rating) {
    var rightSideHtml = document.getElementById(`side${myName.toLowerCase()}${visualIndex}`);
    if (rightSideHtml) {
        rightSideHtml.outerHTML = renderSide(myName.toLowerCase(), randInt(1, 3), feeling, visualIndex, MY_UID);
    }

    let currentRate = descriptionsGlobal.find(d => d.visualIndex === Number(visualIndex))?.ratings[RIGHT_NAME.toLowerCase()] ?? undefined;
    let newRate = currentRate !== undefined ? (Number(currentRate) + Number(rating)) / 2 : rating;
    newRate = Math.round(newRate * 2) / 2;

    setRating(visualIndex, newRate);
    document.addEventListener("click", (e) => {
        if (e.target && e.target.matches(`[data-action="viewComment"][data-visualindex="${visualIndex}"]`)) {
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

    let data = {
        [`participants.${uid}.name`]: myName || "User",
        [`participants.${uid}.description`]: description,
        [`participants.${uid}.feeling`]: feeling,
        [`participants.${uid}.rating`]: rating
    };

    if (justSaveParameter) {
        data[`participants.${uid}.createdAt`] = serverTimestamp();
    } else {
        data[`participants.${uid}.updatedAt`] = serverTimestamp();
    }

    await updateDoc(momentRef, data);
    const localNow = Timestamp.now();
    updateDescriptionsGlobal(momentId, myName.toLowerCase(), description, rating, justSaveParameter, localNow);

    console.log("Momento guardado correctamente");//TODO MANEJAR TOAST

}

function updateDescriptionsGlobal(momentId, userName, description, rating, justSaveParameter, timeValue) {
    const moment = descriptionsGlobal.find(item => Number(item.momentId) === Number(momentId));

    if (!moment) {
        descriptionsGlobal.push({
            momentId: Number(momentId),
            descriptions: {
                [userName]: description
            },
            ratings: {
                [userName]: rating
            },
            times: {
                [userName]: justSaveParameter ? timeValue : null
            },
            timesUpdated: {
                [userName]: justSaveParameter ? null : timeValue
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

    if (!moment.times) {
        moment.times = {};
    }

    if (!moment.timesUpdated) {
        moment.timesUpdated = {};
    }
    moment.descriptions[userName] = description;
    moment.ratings[userName] = rating;
    
    if (justSaveParameter) {
        // Solo setear createdAt si aún no existe
        if (!moment.times[userName]) {
            moment.times[userName] = timeValue;
        }
    } else {
        moment.timesUpdated[userName] = timeValue;
    }

    if (Object.prototype.hasOwnProperty.call(moment.descriptions, "undefined")) {
        delete moment.descriptions.undefined;
    }

    if (Object.prototype.hasOwnProperty.call(moment.ratings, "undefined")) {
        delete moment.ratings.undefined;
    }

    if (Object.prototype.hasOwnProperty.call(moment.times, "undefined")) {
        delete moment.times.undefined;
    }

    if (Object.prototype.hasOwnProperty.call(moment.timesUpdated, "undefined")) {
        delete moment.timesUpdated.undefined;
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

function fillCreateMomentFeelingSelect(genre, currentFeeling = null) {

    const select = document.getElementById("momentFeeling");
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

function renderSongHtml(song, visualIndex) {
    return `<div class="tooltip" data-tip="Abrir en Spotify">
                <a class="btn btn-ghost btn-xs rounded-full" href="${song.url ?? null}" target="_blank"  id="spotifysongurl${visualIndex}"
                    rel="noreferrer">
                    <span class="opacity-90">🎵</span>
                    <span id="spotifysongname${visualIndex}">${song.name ?? null}</span>
                    <span class="opacity-60"  id="spotifysongartist${visualIndex}">—${song.artist ?? null}</span>
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
    <div class="flex flex-col relative cursor-pointer" data-visualindex="${initial_index}" data-feeling="${feeling}" data-user="${name}" data-action="viewComment" data-useruid="${sideUid}" id="side${name}${initial_index}">
        <div class="avatar mx-auto transition-transform duration-300 hover:scale-110">
            <div class="ring-secondary ring-offset-base-100 w-24 rounded-full ring-2 ring-offset-2">
                <img id="avatar${name}${initial_index}" src="assets/img/avatars/${name}${avatarRand}.jpg" />
            </div>
        </div>
        <div class="heartbeat absolute -bottom-5 left-1/2 -translate-x-1/2 badge bg-gray-900 text-[8px] px-1 text-white"
            id="emotion${name}${initial_index}">
            ${feeling ?? ""}
        </div>
    </div>`;
}

function renderPlaceholderSide(name, avatarRand, initial_index, myown, sideUid) {

    if (myown) {

        return `
            <div class="group flex flex-col relative cursor-pointer opacity-80 hover:opacity-100"
                data-visualindex="${initial_index}" data-user="${name}" data-action="noComment" data-useruid="${sideUid}" id="side${name}${initial_index}">
                
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
                data-visualindex="${initial_index}" data-user="${name}" data-action="addComment" data-useruid="${sideUid}" id="side${name}${initial_index}">
                
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

function setRating(visualIndex, value) {
    const v = String(value);
    const target = document.querySelector(`input[name="rating-${visualIndex}"][value="${v}"]`);
    if (target) target.checked = true;
}

function formatDate(timestamp) {
    let date = new Date(timestamp.toMillis());
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long'
    });
}

function formatSecondaryDate(timestamp) {
    const date = timestamp.toDate();
    const year = new Intl.DateTimeFormat("es-PE", {
        year: "numeric"
    }).format(date);
    const time = new Intl.DateTimeFormat("es-PE", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    }).format(date).toLowerCase();

    return `${year} • ${time}`;
}

function formatFullDate(timestamp) {
    const date = timestamp.toDate();

    const formatted = new Intl.DateTimeFormat("es-PE", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    }).format(date);

    return formatted.replace(",", " •");
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

function create3Dimage(url) {
    return `<div class="hover-3d h-86 w-8/12 mx-8">
                <figure class="max-w-100 h-full max-h-fit rounded-2xl">
                    <img src="${url}" alt="3D card" />
                </figure>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>`
};

function toDatetimeLocal(date) {
    const pad = n => String(n).padStart(2, "0");

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
        let newMoment;
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
                console.log(left);
                const right = p[partnerUidTemp] ?? null;

                timestamp = momentData.timestamp;
                let formattedDateWithoutYear = formatDate(timestamp);
                let secondaryDate = formatSecondaryDate(timestamp);

                titulo = momentData.title;
                sex = momentData.sex;
                place = momentData.place;
                newMoment = momentData.new ?? false;
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
                ratingAverage = Math.round(ratingAverage * 2) / 2;
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
                const songHtml = showSong ? renderSongHtml(song, initial_index) : "";
                const intimacyHtml = sex != 0 ? renderIntimacy(initial_index, sex) : "";
                const ratingHtml = renderRating(initial_index);
                if (!newMoment) {
                    carouselImgIds.push(initial_index);
                }
                const imgHtml = newMoment === true ? create3Dimage(momentData.urlImg ?? null) : `<div class="mx-4 h-86 carousel carousel-vertical rounded-box" id="carousel${initial_index}"></div>`;
                const isoTimestamp = timestamp ? toDatetimeLocal(timestamp.toDate()) : "";
                const editMomentButtonHtml = myOwn === true ? ` <button class="z-1000 btn btn-ghost btn-xs top-0 left-0 absolute" data-id="${initial_index}" data-action="editMoment"
                        data-title="${escapeHtml(titulo)}"
                        data-place="${escapeHtml(place)}"
                        data-sex="${sex ?? 0}"
                        data-timestamp="${isoTimestamp}"
                        data-songname=${escapeHtml(song?.name ?? "")}
                        data-songartist=${escapeHtml(song?.artist ?? "")}
                        data-songurl=${song?.url ?? ""}>
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
                        <p class="text-xs text-white/65">${secondaryDate}</p>
                    <h4 class="timeline-title px-6" id="title${initial_index}">${titulo}</h4>
                    ${imgHtml}
                    <div class="flex my-1 items-center justify-center mx-auto">
                        ${ratingHtml}
                    </div>
                    <div class="my-1 flex flex-wrap flex-col items-center justify-center gap-1">
                        <button class="btn btn-ghost btn-xs rounded-full">
                            <span class="opacity-90">📍</span>
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
                    visualIndex: initial_index,
                    momentId: momentData.momentId,
                    descriptions: { [name1]: left?.description ?? null, [name2]: right?.description ?? null },
                    ratings: { [name1]: left?.rating ?? null, [name2]: right?.rating ?? null },
                    timesUpdated: { [name1]: left?.updatedAt ?? null, [name2]: right?.updatedAt ?? null },
                    times: { [name1]: left?.createdAt ?? null, [name2]: right?.createdAt ?? null }
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
                let secondaryDate = formatSecondaryDate(timestamp);

                titulo = momentData.title;
                sex = momentData.sex;
                place = momentData.place;
                newMoment = momentData.new ?? false;
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
                ratingAverage = Math.round(ratingAverage * 2) / 2;
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
                const songHtml = showSong ? renderSongHtml(song, initial_index) : "";
                const intimacyHtml = sex != 0 ? renderIntimacy(initial_index, sex) : "";
                const ratingHtml = renderRating(initial_index);
                if (!newMoment) {
                    carouselImgIds.push(initial_index);
                }
                const imgHtml = newMoment === true ? create3Dimage(momentData.urlImg ?? null) : `<div class="mx-4 h-86 carousel carousel-vertical rounded-box" id="carousel${initial_index}"></div>`;
                const isoTimestamp = timestamp ? toDatetimeLocal(timestamp.toDate()) : "";
                const editMomentButtonHtml = myOwn === true ? ` <button class="z-1000 btn btn-ghost btn-xs top-0 left-0 absolute" data-id="${initial_index}" data-action="editMoment"
                                    data-title="${escapeHtml(titulo)}"
                        data-place="${escapeHtml(place)}"
                        data-sex="${sex ?? 0}"
                        data-timestamp="${isoTimestamp}"
                        data-songname=${escapeHtml(song?.name ?? "")}
                        data-songartist=${escapeHtml(song?.artist ?? "")}
                        data-songurl=${song?.url ?? ""}>
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
                        <p class="text-xs text-white/65">${secondaryDate}</p>
                    <h4 class="timeline-title px-6" id="title${initial_index}">${titulo}</h4>
                    ${imgHtml}
                    <div class="flex my-1 items-center justify-center mx-auto">
                        ${ratingHtml}
                    </div>
                    <div class="my-1 flex flex-wrap flex-col items-center justify-center gap-1">
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
                    visualIndex: initial_index,
                    momentId: momentData.momentId, descriptions: { [name1]: left?.description ?? null, [name2]: right?.description ?? null },
                    ratings: { [name1]: left?.rating ?? null, [name2]: right?.rating ?? null },
                    timesUpdated: { [name1]: left?.updatedAt ?? null, [name2]: right?.updatedAt ?? null },
                    times: { [name1]: left?.createdAt ?? null, [name2]: right?.createdAt ?? null }
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
        const element = event.target.closest("[data-visualindex][data-user][data-action]:not([data-action='noComment'])");
        if (!element) return;

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

    console.log("Left name: ", LEFT_NAME);
    console.log("Right name: ", RIGHT_NAME);

    //Convert to array
    const dataArray = collectionDocs.docs.map(doc => doc.data());
    dataArray.forEach((moment, i) => {
        moment.visualIndex = i + 1;
    });
    for (let i = 0; i < dataArray.length; i += 5) {
        elements.push(dataArray.slice(i, i + 5));
    }

    let dbDocs = collectionDocs.size;

    data = elements.map((group, idx) => ({
        id: idx + 1,
        slides: group.filter(d => d?.visualIndex != null).map(d => ({ index: d.visualIndex }))
    }));

    console.log("Data: ", data);

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

async function readMyUserData(uid) {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) return null;

    return snap.data();
}

function watchAuthState() {
    onAuthStateChanged(auth, async (user) => {
        showLoader();
        if (user) {
            console.log("Se encontro usuario logueado:", user);

            document.getElementById("btnLogOut").classList.remove("hidden");

            MY_UID = auth.currentUser.uid;
            console.log("My UID:", MY_UID);

            const myUserData = await waitForUserDoc(MY_UID);

            if (!myUserData) {
                console.log("no hay info del usuario");
                hideLoader();
                setLoginError("No se encontró información del usuario.");
                showAuthView();
                return;
            }

            GENRE = myUserData.genre;

            var coupleFound = await readCoupleId();
            console.log("Tiene pareja: ", coupleFound)
            if (!coupleFound) {
                hideLoader();
                setLoginError("No se encontró una pareja asociada a este usuario.");
                showCoupleSetupView();
            } else {
                hideLoader();
                showAppView();
                await initTimeLine();
            }
        } else {
            console.log("No hay usuario logueado");
            document.getElementById("btnLogOut").classList.add("hidden");
            hideLoader();
            deleteTimelineData();
            resetLoggedUserData();
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
    "assets/img/1/IMG-20260118-WA0106.jpg",
    "assets/img/1/IMG-20260118-WA0024.jpg",
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
    "assets/img/12/IMGMar.jpg",
    "assets/img/12/IMG_9265.jpg",
    "assets/img/13/IMG_9355.jpg",
    "assets/img/14/20260221_031519.jpg",
    "assets/img/15/20260222.jpg",
    "assets/img/15/20260222_171437.jpg",
    "assets/img/15/20260222_17230.gif",
    "assets/img/16/100IMG_9508.gif",
    "assets/img/16/1120260224_203551.jpg",
    "assets/img/16/12IMG_9497.webp",
    "assets/img/17/IMG_9639.webp",
    "assets/img/18/IMG_9655.webp",
    "assets/img/19/158ca60ba-0361-14008.jpg",
    "assets/img/19/5IMG_9741.gif",
    "assets/img/19/200020260303_2116.jpg",
    "assets/img/2/IMG_8480.jpg",
    "assets/img/2/20260122_224946.jpg",
    "assets/img/21/20260307_214814.webp",
    "assets/img/21/IMG_9835.webp",
    "assets/img/22/20260310_22400.jpg",
    "assets/img/23/1IMG-20260314-WA0001.webp",
    "assets/img/23/IMG_9967.webp",
    "assets/img/3/20260125_110053.jpg",
    "assets/img/3/20260124_183549.jpg",
    "assets/img/3/20260125_002820.jpg",
    "assets/img/4/IMG_85822.gif",
    "assets/img/4/IMG_8573.jpg",
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

    const MAX_VISIBLE_HEARTS = 6;

    const hearts = document.getElementById("intimacyHearts");
    const count = document.getElementById("intimacyCount");
    const hidden = document.getElementById("intimacyValue");
    const plus = document.getElementById("intimacyPlus");
    const minus = document.getElementById("intimacyMinus");

    function renderQuantityIntimacy(popLast = false) {

        hearts.innerHTML = "";

        if (intimacyState === 0) {
            hearts.textContent = "💤";
            count.textContent = "Sin intimidad";
            hidden.value = 0;
            return;
        }

        const visibleHearts = Math.min(intimacyState, MAX_VISIBLE_HEARTS);

        for (let i = 0; i < visibleHearts; i++) {

            const heart = document.createElement("span");
            heart.textContent = "❤️";

            if (popLast && i === visibleHearts - 1) {
                heart.classList.add("heart-pop");
            }

            hearts.appendChild(heart);
        }

        count.textContent = "x" + intimacyState;
        hidden.value = intimacyState;
    }

    plus.onclick = () => {
        intimacyState++;
        renderQuantityIntimacy(true);
    };

    minus.onclick = () => {
        if (intimacyState > 0) {
            intimacyState--;
            renderQuantityIntimacy(false);
        }
    };

    window.renderQuantityIntimacy = renderQuantityIntimacy;
    renderQuantityIntimacy();
}

function setIntimacyValue(value) {
    intimacyState = Number(value || 0);
    if (typeof window.renderQuantityIntimacy === "function") {
        console.log("setting intimacy value");
        window.renderQuantityIntimacy(false);
    }
}

function escapeHtml(text) {
    return String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function saveNewMomentLogic() {
    const btnNewMoment = document.getElementById("btnNewMoment");
    const btnChangeImage = document.getElementById("btnChangeImage");
    const imageInput = document.getElementById("momentImageInput");
    const momentModal = document.getElementById("momentModal");
    const modalTitle = document.getElementById("momentModalTitle");
    const imageSection = document.getElementById("momentImageSection");
    const descriptionSection = document.getElementById("momentDescriptionSection");
    const ratingSection = document.getElementById("momentRatingSection");
    const feelingSection = document.getElementById("momentFeelingSection");
    const momentPreview = document.getElementById("momentPreview");
    const momentImageSrc = document.getElementById("momentImageSrc");
    const momentTimestamp = document.getElementById("momentTimestamp");
    const momentSongId = document.getElementById("momentSongId");
    const momentForm = document.getElementById("momentForm");
    const spotifyResults = document.getElementById("spotifyResults");
    const momentSongInput = document.getElementById("momentSong");
    const momentSongName = document.getElementById("momentSongName");
    const momentSongArtist = document.getElementById("momentSongArtist");
    const momentSongImage = document.getElementById("momentSongImage");
    const momentSongUrl = document.getElementById("momentSongUrl");
    const spotifySelected = document.getElementById("spotifySelected");
    const spotifySelectedImage = document.getElementById("spotifySelectedImage");
    const spotifySelectedName = document.getElementById("spotifySelectedName");
    const spotifySelectedArtist = document.getElementById("spotifySelectedArtist");
    const spotifySelectedUrl = document.getElementById("spotifySelectedUrl");
    const clearSpotifySelectionBtn = document.getElementById("clearSpotifySelection");
    const btnSaveMoment = document.getElementById("btnSaveMoment");

    const inputTitle = document.getElementById("momentTitle");
    const inputDescription = document.getElementById("momentDescription");
    const inputPlace = document.getElementById("momentPlace");
    const inputFeeling = document.getElementById("momentFeeling");
    const inputNoSong = document.getElementById("momentNoSong");
    const ratingInputs = document.querySelectorAll('input[name="rating-newmoment"]');
    const spotifySection = document.getElementById("spotifySection");

    let spotifyDebounceTimer = null;
    let spotifyLastQuery = "";
    let spotifyRequestId = 0;

    let selectedMomentImageFile = null;

    validateMomentForm();

    function configureMomentModalForCreate() {
        momentModalMode = "create";
        editingMomentId = null;

        modalTitle.textContent = "Registrar momento";
        btnSaveMoment.textContent = "Guardar momento";

        imageSection.classList.remove("hidden");
        descriptionSection.classList.remove("hidden");
        ratingSection.classList.remove("hidden");
        feelingSection.classList.remove("hidden");

        fillCreateMomentFeelingSelect(GENRE);
        clearMomentModalForm();
        validateMomentForm();
    }

    function configureMomentModalForEdit() {
        momentModalMode = "edit";

        modalTitle.textContent = "Editar momento";
        btnSaveMoment.textContent = "Guardar cambios";

        imageSection.classList.add("hidden");
        descriptionSection.classList.add("hidden");
        ratingSection.classList.add("hidden");
        feelingSection.classList.add("hidden");
    }

    function clearMomentModalForm() {
        inputTitle.value = "";
        inputPlace.value = "";
        momentTimestamp.value = "";

        setIntimacyValue(0);

        inputNoSong.checked = false;
        spotifySection.classList.remove("hidden");

        clearSpotifySelection();
        momentSongInput.value = "";

        const description = document.getElementById("momentDescription");
        const feeling = document.getElementById("momentFeeling");

        if (description) description.value = "";
        if (feeling) feeling.value = "";

        document.querySelectorAll('input[name="rating-newmoment"]').forEach(r => {
            r.checked = false;
        });

        const previewImage = document.getElementById("momentPreview");
        const imageSrc = document.getElementById("momentImageSrc");

        if (previewImage) previewImage.src = "";
        if (imageSrc) imageSrc.value = "";
    }

    function openEditMomentModal(button) {
        configureMomentModalForEdit();

        editingMomentId = button.dataset.id;

        const title = button.dataset.title;
        const place = button.dataset.place;
        const sex = Number(button.dataset.sex || 0);
        const timestamp = button.dataset.timestamp;

        const songName = button.dataset.songname;
        const songArtist = button.dataset.songartist;
        const songUrl = button.dataset.songurl;

        inputTitle.value = title;
        inputPlace.value = place;
        momentTimestamp.value = timestamp;

        setIntimacyValue(sex);

        const hasSong = songName !== "" && songArtist !== "" && songUrl !== "";

        if (hasSong) {
            inputNoSong.checked = false;
            spotifySection.classList.remove("hidden");

            momentSongId.value = "existing-song";
            momentSongName.value = songName;
            momentSongArtist.value = songArtist;
            momentSongUrl.value = songUrl;
            momentSongImage.value = "";

            momentSongInput.value = `${songName} — ${songArtist}`;

            const spotifySelected = document.getElementById("spotifySelected");
            const spotifySelectedImage = document.getElementById("spotifySelectedImage");
            const spotifySelectedName = document.getElementById("spotifySelectedName");
            const spotifySelectedArtist = document.getElementById("spotifySelectedArtist");
            const spotifySelectedUrl = document.getElementById("spotifySelectedUrl");

            spotifySelectedName.textContent = songName;
            spotifySelectedArtist.textContent = songArtist;
            spotifySelectedUrl.href = songUrl;

            if (spotifySelectedImage) {
                spotifySelectedImage.classList.add("hidden");
                spotifySelectedImage.src = "";
            }

            spotifySelected.classList.remove("hidden");
        } else {
            inputNoSong.checked = true;
            spotifySection.classList.add("hidden");
            clearSpotifySelection();
            momentSongInput.value = "";
        }

        validateMomentForm();
        momentModal.showModal();
    }

    //Editar momento
    document.addEventListener("click", (event) => {
        const editBtn = event.target.closest('[data-action="editMoment"]');
        if (!editBtn) return;

        openEditMomentModal(editBtn);
    });

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

        selectedMomentImageFile = file;

        const reader = new FileReader();

        reader.onload = function (e) {

            configureMomentModalForCreate();

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

    async function searchSpotifyTracks(query) {
        const response = await fetch(`${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error("Error buscando canciones en Spotify");
        }

        return await response.json();
    }

    function showSpotifyResults() {
        spotifyResults.classList.remove("hidden");
    }

    function hideSpotifyResults() {
        spotifyResults.classList.add("hidden");
        spotifyResults.innerHTML = "";
    }

    function clearSpotifySelection() {
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

        validateMomentForm();
    }

    function setSpotifySelection(track) {

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

        validateMomentForm();
    }

    function renderSpotifyResults(tracks) {

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

    async function getNextMomentId(coupleId) {
        const coupleRef = doc(db, "couples", coupleId);

        const nextMomentId = await runTransaction(db, async (transaction) => {
            const coupleSnap = await transaction.get(coupleRef);

            if (!coupleSnap.exists()) {
                throw new Error("No existe el documento del couple");
            }

            const currentLastIndex = coupleSnap.data().lastMomentIndex || 0;
            const newIndex = currentLastIndex + 1;

            transaction.update(coupleRef, {
                lastMomentIndex: newIndex
            });

            return newIndex;
        });

        return nextMomentId;
    }

    async function uploadMomentImage(file, coupleId, momentId) {

        if (!file) throw new Error("No file provided");

        if (!file.type.startsWith("image/")) {
            console.log("No es imagen");
            throw new Error("Selected file is not an image");
        }

        const filePath = `moments/${coupleId}/moment_${momentId}.jpg`;

        const compressedBlob = await compressImage(file, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.8,
            mimeType: "image/jpeg",
            maxSizeMB: 1
        });

        const storageRef = ref(storage, filePath);

        await uploadBytes(storageRef, compressedBlob, {
            contentType: "image/jpeg"
        });

        const downloadURL = await getDownloadURL(storageRef);

        return downloadURL;
    }

    async function createMoment(coupleId, payload) {

        let imageUrl;
        if (!selectedMomentImageFile) {
            throw new Error("No hay imagen seleccionada");
        }

        const momentId = await getNextMomentId(coupleId);

        try {

            imageUrl = await uploadMomentImage(selectedMomentImageFile, coupleId, momentId);

            console.log("URL:", imageUrl);

        } catch (error) {

            console.error("Error subiendo imagen:", error);
            return false;
        }
        const momentRef = doc(db, "couples", coupleId, "moments", String(momentId));
        const momentDate = new Date(payload.timestamp);

        const momentDoc = {
            createdAt: serverTimestamp(),
            createdBy: MY_UID,
            momentId: momentId,
            place: payload.place,
            sex: payload.intimacyCount,
            timestamp: Timestamp.fromDate(momentDate),
            title: payload.title,
            urlImg: imageUrl,
            song: payload.song,
            new: payload.new,
            participants: {
                [MY_UID]: {
                    description: payload.description,
                    feeling: payload.feeling,
                    name: myName,
                    rating: payload.rating,
                    updatedAt: serverTimestamp()
                }
            }
        };

        await setDoc(momentRef, momentDoc);

        return { momentId, imageUrl };
    }

    async function editMoment(coupleId, momentId, payload) {
        if (!momentId) {
            throw new Error("No se recibió el momentId a editar");
        }

        const momentRef = doc(db, "couples", coupleId, "moments", String(momentId));
        const momentDate = new Date(payload.timestamp);

        const hasValidSong =
            payload.song &&
            payload.song.name?.trim() &&
            payload.song.artist?.trim() &&
            payload.song.url?.trim();

        const momentDocUpdate = {
            title: payload.title,
            place: payload.place,
            sex: payload.intimacyCount,
            timestamp: Timestamp.fromDate(momentDate),
            song: hasValidSong
                ? {
                    name: payload.song.name.trim(),
                    artist: payload.song.artist.trim(),
                    url: payload.song.url.trim()
                }
                : null
        };

        await updateDoc(momentRef, momentDocUpdate);

        return { momentId };
    }

    // Guardar
    btnSaveMoment.addEventListener("click", async () => {

        if (btnSaveMoment.disabled) return;

        try {

            momentModal.close();
            showLoader();

            btnSaveMoment.disabled = true;

            if (momentModalMode === "create") {
                if (!momentForm.reportValidity()) return;
                await handleCreateMoment();
            }

            if (momentModalMode === "edit") {
                await handleEditMoment();
            }

        } catch (error) {
            console.error("Error guardando momento:", error);
            momentModal.showModal();
            hideLoader();
        } finally {
            btnSaveMoment.disabled = false;
            validateMomentForm();
            deleteTimelineData();
            initTimeLine();
        }
    });

    async function handleEditMoment() {

        const ratingSelected = document.querySelector('input[name="rating-newmoment"]:checked');
        const noSongChecked = inputNoSong.checked;


        const selectedSong = noSongChecked
            ? null
            : {
                name: momentSongName.value.trim(),
                artist: momentSongArtist.value.trim(),
                url: momentSongUrl.value.trim()
            };

        const payload = {
            title: document.getElementById("momentTitle").value.trim(),
            place: document.getElementById("momentPlace").value.trim(),
            intimacyCount: Number(document.getElementById("intimacyValue").value || 0),
            song: selectedSong,
            timestamp: document.getElementById("momentTimestamp").value
        };

        console.log("Edit: Payload del momento:", payload);

        var momentId = mapMomentId(editingMomentId);

        const result = await editMoment(coupleId, momentId, payload);

        console.log("Momento editado:", result);

        hideLoader();

    }

    async function handleCreateMoment() {

        const ratingSelected = document.querySelector('input[name="rating-newmoment"]:checked');
        const noSongChecked = inputNoSong.checked;


        const selectedSong = noSongChecked
            ? null
            : {
                name: momentSongName.value.trim(),
                artist: momentSongArtist.value.trim(),
                url: momentSongUrl.value.trim()
            };

        const payload = {
            title: document.getElementById("momentTitle").value.trim(),
            place: document.getElementById("momentPlace").value.trim(),
            intimacyCount: Number(document.getElementById("intimacyValue").value || 0),
            song: selectedSong,
            description: document.getElementById("momentDescription").value.trim(),
            rating: ratingSelected ? Number(ratingSelected.value) : null,
            feeling: document.getElementById("momentFeeling").value,
            timestamp: document.getElementById("momentTimestamp").value,
            imageSrc: document.getElementById("momentImageSrc").value,
            new: true
        };

        console.log("Payload del momento:", payload);

        const result = await createMoment(coupleId, payload);

        console.log("Resulttado:", result);

        hideLoader();

    }

    inputNoSong.addEventListener("change", () => {

        if (inputNoSong.checked) {

            spotifySection.classList.add("hidden");

            // limpiar selección si existía
            clearSpotifySelection?.();

            const input = document.getElementById("momentSong");
            if (input) input.value = "";

        } else {

            spotifySection.classList.remove("hidden");

        }

    });

    momentSongInput.addEventListener("focus", () => {
        inputNoSong.checked = false;
        spotifySection.classList.remove("hidden");
    });

    function hasSelectedRating() {
        return !!document.querySelector('input[name="rating-newmoment"]:checked');
    }

    function hasRequiredText(value) {
        return value != null && value.trim() !== "";
    }

    function validateMomentForm() {
        const hasTitle = hasRequiredText(inputTitle.value);
        const hasDescription = hasRequiredText(inputDescription.value);
        const hasPlace = hasRequiredText(inputPlace.value);
        const hasFeeling = hasRequiredText(inputFeeling.value);
        const hasTimestamp = hasRequiredText(momentTimestamp.value);
        const hasRating = hasSelectedRating();

        // Regla de canción:
        // - si "no tiene canción" está activado => válido sin canción
        // - si NO está activado => debe haber canción seleccionada
        const songIsValid = inputNoSong.checked || hasRequiredText(momentSongId.value);

        let formIsValid = false;

        if (momentModalMode === "create") {
            const inputDescription = document.getElementById("momentDescription");
            const inputFeeling = document.getElementById("momentFeeling");
            const hasDescription = inputDescription.value.trim() !== "";
            const hasFeeling = inputFeeling.value.trim() !== "";
            const hasRating = !!document.querySelector('input[name="rating-newmoment"]:checked');

            formIsValid =
                hasTitle &&
                hasPlace &&
                hasTimestamp &&
                hasDescription &&
                hasFeeling &&
                hasRating &&
                songIsValid;
        }

        if (momentModalMode === "edit") {
            formIsValid =
                hasTitle &&
                hasPlace &&
                hasTimestamp &&
                songIsValid;
        }

        btnSaveMoment.disabled = !formIsValid;

        // opcional: feedback visual
        btnSaveMoment.classList.toggle("btn-disabled", !formIsValid);
    }

    [inputTitle, inputDescription, inputPlace, inputFeeling, momentTimestamp, inputNoSong].forEach((element) => {
        element.addEventListener("input", validateMomentForm);
        element.addEventListener("change", validateMomentForm);
    });

    ratingInputs.forEach((radio) => {
        radio.addEventListener("change", validateMomentForm);
    });

    logicRegisterIntimacy();
}

async function compressImage(file, options = {}) {
    const {
        maxWidth = 1600,
        maxHeight = 1600,
        quality = 0.8,
        mimeType = "image/jpeg",
        maxSizeMB = 1
    } = options;

    const imageBitmap = await createImageBitmap(file);

    let { width, height } = imageBitmap;

    // Redimensionar manteniendo proporción
    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    let currentQuality = quality;
    let blob = await canvasToBlob(canvas, mimeType, currentQuality);

    // Si todavía pesa más de 1 MB, bajar calidad progresivamente
    const maxBytes = maxSizeMB * 1024 * 1024;

    while (blob.size > maxBytes && currentQuality > 0.4) {
        currentQuality -= 0.05;
        blob = await canvasToBlob(canvas, mimeType, currentQuality);
    }

    return blob;
}

function canvasToBlob(canvas, mimeType, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("No se pudo convertir canvas a Blob"));
                return;
            }
            resolve(blob);
        }, mimeType, quality);
    });
}