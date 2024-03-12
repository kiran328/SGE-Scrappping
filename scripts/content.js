const BASE_URL = `https://vopa-time-tracing-default-rtdb.asia-southeast1.firebasedatabase.app/queries.json`;
const query = "Tell me information on Mars planet";

function waitForElm(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }
    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

const sleep = (time) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

let isQueryRunning = false;

// setInterval(() => {
//   if (isQueryRunning) return;
//   runQueries();
// }, 1000);


console.log("LOG here... 1")

runQueries();


async function runQueries() {
  try {
    const { docKey, queries } = await getQueries();
    console.log("LOG here.. data", docKey, queries)
    document.body.click();

    let index = 0;
    for (let query of queries) {

      console.log("[ Taking 3000 FIRST ]")
      await sleep(3000);

      console.log("[ Waiting for Input box to appear]")
      const inputParagraphElement = await waitForElm(
        '[placeholder="Ask a follow up"]'
      );

      if (query?.updatedAt) {
        index++;
        continue;
      }
      isQueryRunning = true;

      console.log("[ Writing into Input box ]", query.text)
      inputParagraphElement.value = query.text;

      console.log("[ Focusing into Input box ]")
      inputParagraphElement.focus();


      console.log("[ Taking 5000 pause ]")
      await sleep(5000);

      console.log("[ Finding Send button ]")
      const submitBtn = document.querySelector('button[aria-label="Send"]');

      console.log("[ Clicking Send button ]", submitBtn)
      submitBtn.click();

      const generateBtn = await waitForElm( `[data-oq="${query.text}"] [role='button']`);
      if(generateBtn) {
        const generateBtnSpan = generateBtn.querySelector('.clOx1e')
        if(generateBtnSpan) {
          console.log("[ Clicking Generate Button ]", generateBtnSpan)
          generateBtnSpan.click();
        }
      }

      console.log("[ Waiting for response ]")
      const responseContainer = await waitForElm(
        `[data-rq="${query.text}"] .oD6fhb`
      );

      console.log("[ Got the response ]")
      console.log(responseContainer);

      const responseText = extractTextWithNewlines(responseContainer.innerHTML);

      console.log(responseText);

      let updatedData = [...queries];
      updatedData[index].response = responseText;
      updatedData[index].updatedAt = Date.now();
      await updateQueryResponses({ [docKey]: updatedData });
      await sleep(0);
      // document.querySelector('[aria-label="New chat"] button').click();
      isQueryRunning = false;
      index++;
    }
  } catch (error) {
    console.log("LOG Error: ", error);
    // isQueryRunning = false;
    // document.querySelector('[aria-label="New chat"] button').click();
  }
}

async function getQueries() {
  const res = await fetch(BASE_URL);
  let data = await res.json();
  
  const docKey = Object.keys(data).at(0);
  data = data[docKey];

  console.log("LOG da", docKey, data);
  return { docKey, queries: data };
}

async function updateQueryResponses(data) {
  const res = await fetch(BASE_URL, {
    method: "PATCH",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  await res.json();
}

function extractTextWithNewlines(html) {
  let tempElement = document.createElement("div");
  tempElement.innerHTML = html;
  let text = "";
  for (let node of tempElement.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.nodeValue.trim() + "\n";
    } else if (
      node.nodeType === Node.ELEMENT_NODE &&
      node.tagName.toLowerCase() !== "script"
    ) {
      text += extractTextWithNewlines(node.innerHTML);
    }
  }
  text = text.replace(/\n{3,}/g, "\n");
  return text;
}
