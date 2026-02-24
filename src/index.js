import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCyyRztCmDuib7FbpfYhsk7KJsIlpySJck",
    authDomain: "timelinebel.firebaseapp.com",
    projectId: "timelinebel",
    storageBucket: "timelinebel.appspot.com",
    messagingSenderId: "998005125683",
    appId: "1:998005125683:web:6b73f4f265724f48b86946"
};

const data = [
    { id: 1, slides: [{ index: 1 }, { index: 2 }, { index: 3 }, { index: 4 }, { index: 5 }] },
    { id: 2, slides: [{ index: 6 }, { index: 7 }, { index: 8 }, { index: 9 }, { index: 10 }] },
    { id: 3, slides: [{ index: 11 }, { index: 12 }, { index: 13 }, { index: 14 }, { index: 15 }] },
    { id: 4, slides: [{ index: 16 }] }
];

const dbData = [];

let elements = [];

function setBackgroundInitial() {
    let backgroundinitial = document.getElementById("container0");
    const min = 1;
    const max = 6;
    const random_number = Math.floor(Math.random() * (max - min + 1)) + min;
    backgroundinitial.style.backgroundImage = `url(assets/img/hero${random_number}.jpg)`;
    backgroundinitial.style.backgroundPosition = "center";


    for (var g = 1; g <= 16; g++) {
        let swiper = document.getElementById(`swiper-slide${g}`);
        const min = 1;
        const max = 5;
        const random_number = Math.floor(Math.random() * (max - min + 1)) + min;
        swiper.style.backgroundImage = `url(assets/img/back${random_number}.jpg)`;
        swiper.style.backgroundPosition = "center";
    }

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

    for (let i = 0; i < 16; i++) {
        let carousel = document.getElementById("carousel" + i);
        const subArray = imagesUrls.filter(url => url.includes(`/img/${i}/`));
        finalArray.push(subArray);
        for (var j = 0; j < finalArray[i].length; j++) {
            carousel.innerHTML += carouselItemHtml1 + subArray[j] + carouselItemHtml2;
        }
    }

}

const getFirebaseDocs = async () => {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const coll = collection(db, "/moments");
    const reading = await getDocs(query(coll, orderBy("timestamp", "asc")));
    return reading;
}

function addContainersAndSlides(dbDocs) {
    let newConts = Math.ceil(dbDocs / 5);
    console.log(newConts);
    let initial_containerid = 5;
    let initial_index = 21;
    let last_indexes = dbDocs % 5;

    let containerSection = document.getElementById("slides_section");

    for (let j = 0; j < newConts; j++) {
        let slides = [];
        let timestamp;
        let titulo;
        let descripcion;
        let url;
        let contDiv = document.createElement("div");
        contDiv.classList.add("container", "h-screen", "relative");
        contDiv.id = `container${initial_containerid}`;
        let previousDivId = `container${initial_containerid - 1}`;
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
        containerSection.insertBefore(contDiv, referencePrevCont);
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
                descripcion = elements[j][x].description;
                url = elements[j][x].imgUrl;
                let slideDiv = document.createElement("div");
                slideDiv.classList.add("swiper-slide");
                let min = 1;
                let max = 5;
                let random_number = Math.floor(Math.random() * (max - min + 1)) + min;
                slideDiv.style.backgroundImage = `url(assets/img/back${random_number}.jpg)`;
                swiperHtml = `                
    
                <div class="swiper-slide-content">
                    <span
                        class="timeline-year">${formattedDateWithoutYear}</span>
                    <div
                        class="h-60 carousel carousel-vertical rounded-box"
                        id="carousel0">
                        <div class="carousel-item h-full flex justify-center ">
                    <img src="${url}">
                    </div>
    
                    </div>
                    <h4 class="timeline-title">${titulo}</h4>
                    <div class="timeline-text">${descripcion}
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
                descripcion = elements[j][x].description;
                url = elements[j][x].imgUrl;
                let slideDiv = document.createElement("div");
                slideDiv.classList.add("swiper-slide");
                let min = 1;
                let max = 5;
                let random_number = Math.floor(Math.random() * (max - min + 1)) + min;
                slideDiv.style.backgroundImage = `url(assets/img/back${random_number}.jpg)`;
                swiperHtml = `                
    
                <div class="swiper-slide-content">
                    <span
                        class="timeline-year">${formattedDateWithoutYear}</span>
                    <div
                        class="h-60 carousel carousel-vertical rounded-box"
                        id="carousel0">
                        <div class="carousel-item h-full flex justify-center ">
                    <img src="${url}">
                    </div>
    
                    </div>
                    <h4 class="timeline-title">${titulo}</h4>
                    <div class="timeline-text">${descripcion}
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

    buildFirstPagination();

    setAllCarouselItems();

    /*
    
    const collectionDocs = await getFirebaseDocs();

    //Convert to array
    const dataArray = collectionDocs.docs.map(doc => doc.data());
    for (let i = 0; i < dataArray.length; i += 5) {
        elements.push(dataArray.slice(i, i + 5));
    }

    let dbDocs = collectionDocs.size;

    //console.log(dbDocs);

    addContainersAndSlides(dbDocs);

    buildSecondPagination();

    
    */

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