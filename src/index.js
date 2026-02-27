import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, documentId } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBZfy3js-AuLcw1jmnTRjWVCQkmv1pUtSU",
    authDomain: "marlove-9b442.firebaseapp.com",
    projectId: "marlove-9b442",
    storageBucket: "marlove-9b442.firebasestorage.app",
    messagingSenderId: "148329779594",
    appId: "1:148329779594:web:8fde6c7449d0ce6dce7873",
    measurementId: "G-CFRRZKFDQL"
};

/*let data = [
    { id: 1, slides: [{ index: 1 }, { index: 2 }, { index: 3 }, { index: 4 }, { index: 5 }] },
    { id: 2, slides: [{ index: 6 }, { index: 7 }, { index: 8 }, { index: 9 }, { index: 10 }] },
    { id: 3, slides: [{ index: 11 }, { index: 12 }, { index: 13 }, { index: 14 }, { index: 15 }] },
    { id: 4, slides: [{ index: 16 }] }
];*/

let data = [];

const dbData = [];

let elements = [];

function setBackgroundInitial() {
    let backgroundinitial = document.getElementById("container0");
    const min = 1;
    const max = 6;
    const random_number = Math.floor(Math.random() * (max - min + 1)) + min;
    backgroundinitial.style.backgroundImage = `url(assets/img/hero${random_number}.jpg)`;
    backgroundinitial.style.backgroundPosition = "center";


    /*for (var g = 1; g <= 16; g++) {
        let swiper = document.getElementById(`swiper-slide${g}`);
        const min = 1;
        const max = 5;
        const random_number = Math.floor(Math.random() * (max - min + 1)) + min;
        swiper.style.backgroundImage = `url(assets/img/back${random_number}.jpg)`;
        swiper.style.backgroundPosition = "center";
    }*/

}

const swipers = {};

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
                    console.log("Rendering index: ", index);
                    console.log(containerData.slides[index]);
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

    for (let i = 1; i <= 15; i++) {
        let carousel = document.getElementById("carousel" + i);
        const subArray = imagesUrls.filter(url => url.includes(`/img/${i-1}/`));
        finalArray.push(subArray);
        for (var j = 0; j < finalArray[i-1].length; j++) {
            carousel.innerHTML += carouselItemHtml1 + subArray[j] + carouselItemHtml2;
        }
    }

}

const getFirebaseDocs = async () => {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const coll = collection(db, "/moments");
    const reading = await getDocs(query(coll, orderBy("momentId", "asc")));
    return reading;
}

function addContainersAndSlides(dbDocs) {
    let newConts = Math.ceil(dbDocs / 5);
    console.log(newConts);
    let initial_containerid = 1;
    let initial_index = 1;
    let last_indexes = dbDocs % 5;

    let containerSection = document.getElementById("slides_section");

    for (let j = 0; j < newConts; j++) {
        let slides = [];
        let timestamp;
        let titulo;
        let descripcion;
        let url;
        let sex = 0;
        let ratingjose = 0;
        let ratingmar = 0;
        let place;
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
        let referencePrevCont = document.getElementById(previousDivId);
        if(initial_containerid === 1){
            containerSection.appendChild(contDiv);
        } else {
            containerSection.insertBefore(contDiv, referencePrevCont);
        }

        let swiper_container_div = document.getElementById(`swiper_container${initial_containerid}`);

        let swiperHtml = ``;
        if (j == newConts - 1 && last_indexes !== 0) {
            for (let x = 0; x < last_indexes; x++) {
                timestamp = elements[j][x].timestamp;
                let date = new Date(timestamp.toMillis());

                let formattedDateWithoutYear = date.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }).replace(/ de \d{4}$/, '');

                titulo = elements[j][x].title;
                descripcion = elements[j][x].descriptionjose ?? null;
                url = elements[j][x].imgUrl ?? null;
                sex = elements[j][x].sex;
                ratingjose = elements[j][x].ratingjose ?? null;;
                ratingmar = elements[j][x].ratingmar ?? null;;
                place = elements[j][x].place;
                //url = elements[j][x].imgUrl;
                let slideDiv = document.createElement("div");
                slideDiv.classList.add("swiper-slide");
                let min = 1;
                let max = 5;
                let javatar = 3;
                let maravatar = 4;
                let random_number = Math.floor(Math.random() * (max - min + 1)) + min;
                let random_javatar = Math.floor(Math.random() * (javatar - 1 + 1)) + 1;
                let random_maravatar = Math.floor(Math.random() * (maravatar - 1 + 1)) + 1;
                slideDiv.style.backgroundImage = `url(assets/img/back${random_number}.jpg)`;
                swiperHtml = `                
    
                <div class="swiper-slide-content">
                    <span
                        class="timeline-year">${formattedDateWithoutYear}</span>
                    <h4 class="timeline-title px-6" id="title${initial_index}">${titulo}</h4>
                    <div class="flex my-2 items-center justify-center mx-auto">
                        <div class="rating rating-sm rating-half">
                            <input type="radio" name="rating-2" class="rating-hidden" />

                            <input type="radio" name="rating-${initial_index}" value="0.5" class="mask mask-star-2 mask-half-1 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="1"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="1.5" class="mask mask-star-2 mask-half-1 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="2"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="2.5" class="mask mask-star-2 mask-half-1 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="3"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="3.5" class="mask mask-star-2 mask-half-1 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="4"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="4.5" class="mask mask-star-2 mask-half-1 bg-orange-400" checked="checked" />
                            <input type="radio" name="rating-${initial_index}" value="5"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
                        </div>
                    </div>

                    <div class="h-86 carousel carousel-vertical rounded-box" id="carousel${initial_index}"></div>

                    <div class="mt-2 flex flex-wrap flex-col items-center justify-center gap-1">
                        <button class="btn btn-ghost btn-xs rounded-full">
                            <span class="opacity-70">📍</span>
                            <span id="place${initial_index}">${place}</span>
                        </button>
                        <div class="tooltip" data-tip="Abrir en Spotify">
                            <a class="btn btn-ghost btn-xs rounded-full" href="SPOTIFY_URL" target="_blank"
                                rel="noreferrer">
                                <span class="opacity-90">🎵</span>
                                <span>Nuestra aflicción</span>
                                <span class="opacity-60">— Pxndx</span>
                            </a>
                        </div>
                        <div class="tooltip" data-tip="Momentos íntimos ese día" id="intimacy${initial_index}">
                            <span class="badge badge-ghost badge-lg rounded-full">
                                ❤️ × ${sex}
                            </span>
                        </div>
                    </div>

                    <div class="my-1 p-3 grid grid-cols-2">
                        <div class="flex flex-col relative cursor-pointer" onclick="my_modal_2.showModal()">
                            <div class="avatar mx-auto transition-transform duration-300 hover:scale-110">
                                <div
                                    class="ring-secondary ring-offset-base-100 w-24 rounded-full ring-2 ring-offset-2">
                                    <img id="avatarjose${initial_index}" src="assets/img/avatars/jose${random_javatar}.jpg" />
                                </div>
                            </div>
                            <div
                                class="heartbeat absolute -bottom-5 left-1/2 -translate-x-1/2 badge bg-gray-900 text-[8px] px-1" id="emotionjose1">
                                Emocionado🥹</div>
                        </div>

                        <div class="flex flex-col relative">
                            <div class="avatar mx-auto transition-transform duration-300 hover:scale-110">
                                <div
                                    class="ring-secondary ring-offset-base-100 w-24 rounded-full ring-2 ring-offset-2">
                                    <img id="avatarmar${initial_index}" src="assets/img/avatars/mar${random_maravatar}.jpg" />
                                </div>
                            </div>
                            <div
                                class="heartbeat absolute -bottom-5 left-1/2 -translate-x-1/2 badge bg-gray-900 text-[8px] px-1" id="emotionmar1">
                                Nerviosa😅</div>
                        </div>
                    </div>

                </div>
                `;
                slideDiv.innerHTML = swiperHtml;
                swiper_container_div.appendChild(slideDiv);
                var ind = { index: initial_index };
                slides.push(ind);
                initial_index++;
            }
        } else {
            for (let x = 0; x < 5; x++) {
                timestamp = elements[j][x].timestamp;
                let date = new Date(timestamp.toMillis());

                let formattedDateWithoutYear = date.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }).replace(/ de \d{4}$/, '');
                titulo = elements[j][x].title;
                descripcion = elements[j][x].descriptionjose ?? null;
                url = elements[j][x].imgUrl ?? null;
                sex = elements[j][x].sex;
                ratingjose = elements[j][x].ratingjose ?? null;;
                ratingmar = elements[j][x].ratingmar ?? null;;
                place = elements[j][x].place;
                //url = elements[j][x].imgUrl;
                let slideDiv = document.createElement("div");
                slideDiv.classList.add("swiper-slide");
                let min = 1;
                let max = 5;
                let javatar = 3;
                let maravatar = 4;
                let random_number = Math.floor(Math.random() * (max - min + 1)) + min;
                let random_javatar = Math.floor(Math.random() * (javatar - 1 + 1)) + 1;
                let random_maravatar = Math.floor(Math.random() * (maravatar - 1 + 1)) + 1;
                slideDiv.style.backgroundImage = `url(assets/img/back${random_number}.jpg)`;
                swiperHtml = `                
    
                <div class="swiper-slide-content">
                    <span
                        class="timeline-year">${formattedDateWithoutYear}</span>
                    <h4 class="timeline-title px-6" id="title${initial_index}">${titulo}</h4>
                    <div class="flex my-2 items-center justify-center mx-auto">
                        <div class="rating rating-sm rating-half">
                            <input type="radio" name="rating-2" class="rating-hidden" />

                            <input type="radio" name="rating-${initial_index}" value="0.5" class="mask mask-star-2 mask-half-1 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="1"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="1.5" class="mask mask-star-2 mask-half-1 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="2"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="2.5" class="mask mask-star-2 mask-half-1 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="3"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="3.5" class="mask mask-star-2 mask-half-1 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="4"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
                            <input type="radio" name="rating-${initial_index}" value="4.5" class="mask mask-star-2 mask-half-1 bg-orange-400" checked="checked" />
                            <input type="radio" name="rating-${initial_index}" value="5"   class="mask mask-star-2 mask-half-2 bg-orange-400" />
                        </div>
                    </div>

                    <div class="h-86 max-h-fit carousel carousel-vertical rounded-box" id="carousel${initial_index}"></div>

                    <div class="mt-2 flex flex-wrap flex-col items-center justify-center gap-1">
                        <button class="btn btn-ghost btn-xs rounded-full">
                            <span class="opacity-70">📍</span>
                            <span id="place${initial_index}">${place}</span>
                        </button>
                        <div class="tooltip" data-tip="Abrir en Spotify">
                            <a class="btn btn-ghost btn-xs rounded-full" href="SPOTIFY_URL" target="_blank"
                                rel="noreferrer">
                                <span class="opacity-90">🎵</span>
                                <span>Nuestra aflicción</span>
                                <span class="opacity-60">— Pxndx</span>
                            </a>
                        </div>
                        <div class="tooltip" data-tip="Momentos íntimos ese día" id="intimacy${initial_index}">
                            <span class="badge badge-ghost badge-lg rounded-full">
                                ❤️ × ${sex}
                            </span>
                        </div>
                    </div>

                    <div class="my-1 p-3 grid grid-cols-2">
                        <div class="flex flex-col relative cursor-pointer" onclick="my_modal_2.showModal()">
                            <div class="avatar mx-auto transition-transform duration-300 hover:scale-110">
                                <div
                                    class="ring-secondary ring-offset-base-100 w-24 rounded-full ring-2 ring-offset-2">
                                    <img id="avatarjose${initial_index}" src="assets/img/avatars/jose${random_javatar}.jpg" />
                                </div>
                            </div>
                            <div
                                class="heartbeat absolute -bottom-5 left-1/2 -translate-x-1/2 badge bg-gray-900 text-[8px] px-1" id="emotionjose1">
                                Emocionado🥹</div>
                        </div>

                        <div class="flex flex-col relative">
                            <div class="avatar mx-auto transition-transform duration-300 hover:scale-110">
                                <div
                                    class="ring-secondary ring-offset-base-100 w-24 rounded-full ring-2 ring-offset-2">
                                    <img id="avatarmar${initial_index}" src="assets/img/avatars/mar${random_maravatar}.jpg" />
                                </div>
                            </div>
                            <div
                                class="heartbeat absolute -bottom-5 left-1/2 -translate-x-1/2 badge bg-gray-900 text-[8px] px-1" id="emotionmar1">
                                Nerviosa😅</div>
                        </div>
                    </div>

                </div>
                `;
                slideDiv.innerHTML = swiperHtml;
                swiper_container_div.appendChild(slideDiv);
                var ind = { index: initial_index };
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
                    console.log("Rendering index: ", index);
                    console.log(containerData.slides[index]);
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

document.addEventListener("DOMContentLoaded", async function () {

    startCountdown("2026-01-15T16:17:00");

    setBackgroundInitial();

    const collectionDocs = await getFirebaseDocs();

    //Convert to array
    const dataArray = collectionDocs.docs.map(doc => doc.data());
    for (let i = 0; i < dataArray.length; i += 5) {
        elements.push(dataArray.slice(i, i + 5));
    }

    let dbDocs = collectionDocs.size;

    console.log("Total documents in collection: ", dbDocs);
    console.log("Elements: ", elements);

    data = elements.map((group, idx) => ({
        id: idx + 1,
        slides: group
            // por si acaso alguno viniera sin momentId (no debería), lo filtramos
            .filter(d => d?.momentId != null)
            // y lo convertimos al formato { index: momentId }
            .map(d => ({ index: d.momentId }))
    }));

    console.log("Data: ",data);

    addContainersAndSlides(dbDocs);

    setAllCarouselItems();

    buildFirstPagination();

    /*buildSecondPagination();*/

    scrollButtonsLogic();
    firstMomentLogic();

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