document.addEventListener("readystatechange", (event) => {
    if (event.target.readyState === "complete") {
        initApp();
    }
});

const initApp = () => {
    setSearchFocus();

    const form = document.getElementById("searchBar");
    form.addEventListener("submit", submitSearch);

    const search = document.getElementById("search");
    search.addEventListener("input", showClearTextButton);

    const clear = document.getElementById("clear");
    clear.addEventListener("click", clearSearchText);
    clear.addEventListener("keydown", clearSearchTextListener);
};

const setSearchFocus = () => {
    document.getElementById("search").focus();
};

const showClearTextButton = () => {
    const search = document.getElementById("search");
    const clear = document.getElementById("clear");

    if (search.value) {
        clear.classList.remove("none");
        clear.classList.add("flex");
    } else {
        clear.classList.add("none");
        clear.classList.remove("flex");
    }
};

const clearSearchText = () => {
    document.getElementById("search").value = "";
    const clear = document.getElementById("clear");
    clear.classList.add("none");
    clear.classList.remove("flex");
    setSearchFocus();
};

const clearSearchTextListener = (event) => {
    if (event.key === "Enter" || event.key === " ") {
        document.getElementById("clear").click();
        setSearchFocus();
    }
};

const submitSearch = (event) => {
    // * `event` is automatically passed to this function
    event.preventDefault();
    clearPreviousResults();
    processSearch();
    setSearchFocus();
};

const clearPreviousResults = () => {
    const parentElement = document.getElementById("searchResults");
    while (parentElement.lastElementChild) {
        parentElement.removeChild(parentElement.lastElementChild);
    }
};

const processSearch = async () => {
    clearStatsLine();

    const formatedSearchTerm = formatSearchTerm();
    if (!formatedSearchTerm) return;

    const wikiSearchString = getWikiSearchString(formatedSearchTerm);
    const wikiSearchResults = await requestData(wikiSearchString);

    let resultArray = [];
    if (wikiSearchResults.hasOwnProperty("query")) {
        resultArray = processWikiResults(wikiSearchResults.query.pages);
    }

    console.log(resultArray);
    if (resultArray) buildSearchResults(resultArray);

    setStatsLine(resultArray);
};

const formatSearchTerm = () => {
    const rawSearchTerm = document.getElementById("search").value.trim();
    const regex = /\s{2,}/g;
    const formatedSearchTerm = rawSearchTerm.replace(regex, " ");
    return formatedSearchTerm;
};

const getWikiSearchString = (searchTerm) => {
    const maxChars = getMaxChars();
    const rawSearchString = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${searchTerm}&gsrlimit=20&prop=pageimages|extracts&exchars=${maxChars}&exintro&explaintext&exlimit=max&format=json&origin=*`;
    const searchString = encodeURI(rawSearchString);
    return searchString;
};

const getMaxChars = () => {
    const width = window.innerWidth || document.body.clientWidth;
    const maxChars = width < 414 ? 65 : width < 1400 ? 100 : 130;
    return maxChars;
};

const requestData = async (searchString) => {
    try {
        const response = await fetch(searchString);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
    }
};

const processWikiResults = (searchResults) => {
    const resultArray = [];

    Object.keys(searchResults).forEach((key) => {
        const id = key;
        const title = searchResults[key].title;
        const extract = searchResults[key].extract;
        const image = searchResults[key].hasOwnProperty("thumbnail")
            ? searchResults[key].thumbnail.source
            : null;

        const item = {
            id: id,
            title: title,
            extract: extract,
            image: image,
        };

        resultArray.push(item);
    });

    return resultArray;
};

const buildSearchResults = (resultArray) => {
    const searchResults = document.getElementById("searchResults");

    resultArray.forEach((result) => {
        const resultItem = document.createElement("div");
        const resultTitle = createTitle(result);
        const resultContents = createContents(result);

        resultItem.className = "resultItem";
        resultItem.appendChild(resultTitle);
        resultItem.appendChild(resultContents);
        searchResults.appendChild(resultItem);
    });
};

const createTitle = (result) => {
    const resultTitle = document.createElement("div");
    resultTitle.className = "resultTitle";

    const link = document.createElement("a");
    link.href = `https://en.wikipedia.org/?curid=${result.id}`;
    link.target = "_blank";
    link.textContent = result.title;

    resultTitle.appendChild(link);
    return resultTitle;
};

const createContents = (result) => {
    const resultContents = document.createElement("div");
    resultContents.className = "resultContents";

    if (result.image) {
        const resultImage = createImage(result);
        resultContents.appendChild(resultImage);
    }

    const resultExtract = createExtract(result);
    resultContents.appendChild(resultExtract);

    return resultContents;
};

const createImage = (result) => {
    const resultImage = document.createElement("div");
    resultImage.className = "resultImage";

    const img = document.createElement("img");
    img.src = result.image;
    img.alt = result.title;

    resultImage.appendChild(img);

    return resultImage;
};

const createExtract = (result) => {
    const resultExtract = document.createElement("div");
    resultExtract.className = "resultExtract";
    const resultDescription = document.createElement("p");
    resultDescription.className = "resultDescription";
    resultDescription.textContent = result.extract;

    resultExtract.appendChild(resultDescription);
    return resultExtract;
};

const clearStatsLine = () => {
    document.getElementById("stats").textContent = "";
};

const setStatsLine = (resultArray) => {
    document.getElementById("stats").textContent = resultArray.length
        ? `Displaying ${resultArray.length} results.`
        : "Sorry, no results.";
};
