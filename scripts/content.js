const BASE_URL = `https://brand-luminaire-default-rtdb.firebaseio.com`;

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

setInterval(() => {
  if (isQueryRunning) return;
  runQueries();
}, 2000);

async function runQueries() {
  try {
    const { queries } = await getQueries();

    if(queries.length === 0) return;

    const [query]  = queries;

    document.body.click();

    console.log("[ Taking 3000 FIRST ]");
    await sleep(3000);

    console.log("[ Waiting for Input box to appear]");
    const inputParagraphElement = await waitForElm(
      '[placeholder="Ask a follow up"]'
    );

    isQueryRunning = true;

    console.log("[ Writing into Input box ]", query.text);
    inputParagraphElement.value = query.text;

    console.log("[ Focusing into Input box ]");
    inputParagraphElement.focus();

    console.log("[ Taking 5000 pause ]");
    await sleep(5000);

    console.log("[ Finding Send button ]");
    const submitBtn = document.querySelector('button[aria-label="Send"]');

    console.log("[ Clicking Send button ]", submitBtn);
    submitBtn.click();

    const generateBtn = await waitForElm(
      `[data-oq="${query.text}"] [role='button']`
    );
    if (generateBtn) {
      const generateBtnSpan = generateBtn.querySelector(".clOx1e");
      if (generateBtnSpan) {
        console.log("[ Clicking Generate Button ]", generateBtnSpan);
        generateBtnSpan.click();
      }
    }

    console.log("[ Waiting for response ]");
    const responseContainer = await waitForElm(
      `[data-rq="${query.text}"] [jsname].oD6fhb`
    );

    console.log("[ Got the response ]");
    console.log(responseContainer);

    const responseText = extractTextWithNewlines(responseContainer.innerHTML);

    console.log(responseText);
    await updateQueryResponses(query.id, responseText);
    await sleep(0);
    isQueryRunning = false;
  } catch (error) {
    console.log("LOG Error: ", error);
  }
}

async function getQueries() {
  const res = await fetch(`${BASE_URL}/sge.json`);
  let data = await res.json();

  const updatedQueries = [];
  for (let key in data) {
    updatedQueries.push({
      id: key,
      ...data[key],
    });
  }
  return { queries: updatedQueries.filter(query=> !query.updatedAt) };
}

async function updateQueryResponses(id, responseText) {
  const res = await fetch(`${BASE_URL}/sge/${id}.json`, {
    method: "PATCH",
    body: JSON.stringify({
      response: responseText,
      updatedAt: Date.now(),
    }),
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
