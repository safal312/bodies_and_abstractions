let bodypix;
let video;
let segmentation;
let c;
let synth = window.speechSynthesis;
let text;
let opacity = 150;

const options = {
  outputStride: 8, // 8, 16, or 32, default is 16
  segmentationThreshold: 0.3, // 0 - 1, defaults to 0.5
};

function windowResized() {
    c.resize(windowWidth * 0.70, windowHeight);
    c.position(0.15 * windowWidth, 0);
}

function preload() {
  bodypix = ml5.bodyPix(options);
}

function setup() {
  c = createCanvas(windowWidth * 0.70, windowHeight);
  c.position(0.15 * windowWidth, 0);
  video = createCapture(VIDEO, videoReady);
  video.size(width, height);
  video.hide();
}

function videoReady() {
  bodypix.segment(video, gotResults);
}

let start = true;
let called = false;
let called2 = false;
let showed = false;

function draw() {
    if (frameCount > 100 && start) {
        start = false;
        welcomeMessage();
    }

    if (frameCount > 500) {
        if (!called) {
            called = true;
            text = video._pInst.canvas.toDataURL();
            callAPI();
            setBG(text);
        }
        if (segmentation) {
            clear();
            tint(182, 22, 22, opacity);
            image(segmentation.backgroundMask, 0, 0, width, width * 0.75);
        }
    } else {
        image(video, 0, 0, width, width * 0.75);
    }

    if (called && frameCount % 120 == 0) {
        setBG(text.substr(Math.floor(Math.random() * 1000)));
        if (opacity > 40) {
          opacity -= 10;
        } else {
          if (showed == false) {
            showed = true; 
            showOption();
          }
        }
    }
}

function showOption() {
    let div = document.createElement("div");
    div.classList.add('box');
    div.innerText = "Save results?";

    let timer = 10;
    let button = document.createElement("button");
    button.innerText = "Yes (10)";
    button.classList.add('yes');
    div.appendChild(button);

    let button2 = document.createElement("button");
    button2.innerText = "No";
    button2.classList.add('no');
    button2.disabled = true;
    div.appendChild(button2);

    document.body.appendChild(div);

    let x = setInterval(() => {
      timer = timer - 1;
      document.querySelector('.yes').innerText = "Yes (" + timer.toString() + ")";
      if (timer == 0) {
        clearInterval(x);
        end();
      }
    }, 1000);

    document.querySelector('.yes').addEventListener('click', () => {
      end();
    })
  }

function end() {
  document.querySelector('.box').remove();
  opacity = 0;
  speak("Thank you for saving your results. I'm glad to hear that you had a great experience. See you again!", {rate: 0.8, pitch: 0});
  setTimeout(() => {
    window.location.reload();
  }, 10000);
}

function gotResults(error, result) {
  if (error) {
    console.log(error);
    return;
  }
  segmentation = result;
  bodypix.segment(video, gotResults);
}

function welcomeMessage() {
    speak("Hello. I see you. How are you?. I will just take a good look at you.", {rate: 0.8, pitch: 0});
}

function speak(text, value) {
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = value.pitch;
    utterance.rate = value.rate;
    synth.speak(utterance);
}
  
function setBG(text) {
    document.querySelector('.container').innerText = text;
}

function callAPI() {
    let blob = dataURItoBlob(text);
    const data = new FormData();
    data.append("file", blob);
    data.append("detection_flags", "propoints,classifiers,content");
    data.append("recognize_targets", "all@celebrities.betaface.com");

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    let h = document.createElement("h4");
    h.classList.add('loading');
    h.innerText = "Loading...";

    document.body.appendChild(h);

    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === this.DONE) {
        document.querySelector('.loading').remove();
        if (this.status == 200) {
          continueConversation(this.responseText);
        } else {
          speak("Sorry, there has been an error. Let's try this again.", {rate: 0.8, pitch: 0});
          window.location.reload();
        }
      }
    });

    xhr.open("POST", "https://betaface-face-recognition-v1.p.rapidapi.com/media/file");
    xhr.setRequestHeader("x-rapidapi-key", "748b47f02cmshfdeb621a50425adp1d28c5jsn5b240c9ff29b");
    xhr.setRequestHeader("x-rapidapi-host", "betaface-face-recognition-v1.p.rapidapi.com");

    xhr.send(data);
}

function continueConversation(res) {
  let convers = "I have made some observations.";
  let response = JSON.parse(res);
  let tags = response.media.faces[0].tags;
  convers += " I think";
  convers += tags[18].value == "male" ? " you are a male. " : " you are a female. ";
  convers += "You are " + tags[1].value.toString() + " years old. ";
  convers += "Your race is " + tags[31].value + ". ";
  let att = tags[3].value == "no" ? "not" : "";
  convers += "You are " + att + " attractive. ";
  // att = tags[4].value == "no" ? "don't" : "";
  // convers += "You " + att + " have bags under your eyes. ";
  att = tags[5].value == "no" ? "not" : "";
  convers += "You are " + att + " bald. ";
  att = tags[8].value == "no" ? "don't" : "";
  convers += "You " + att + " have big lips. ";
  att = tags[9].value == "no" ? "don't" : "";
  convers += "You " + att + " have a big nose. ";
  att = tags[16].value == "no" ? "don't" : ""
  convers += "You " + att + " have a double chin. ";
  att = tags[22].value == "no" ? "don't" : "";
  convers += "You " + att + " have heavy makeup on. ";
  att = tags[5].value == "no" ? "not" : "";
  convers += "You are " + att + " young. ";

  text = convers;
  for (let i = 0; i < 200; i++) {
    text += convers;
  }
  document.querySelector('.container').style.fontSize = "16px";
  
  speak(convers, {rate: 0.7, pitch: 0});
}




function dataURItoBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  //Old Code
  //write the ArrayBuffer to a blob, and you're done
  //var bb = new BlobBuilder();
  //bb.append(ab);
  //return bb.getBlob(mimeString);

  //New Code
  return new Blob([ab], {type: mimeString});
}