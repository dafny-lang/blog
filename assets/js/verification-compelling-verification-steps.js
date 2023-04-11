
var stepsContainers = document.querySelectorAll("div.step-through");
function setUpStepContainer(stepContainer) {
  var steps = stepContainer.querySelectorAll("div.step");
  var locationStepHash = document.location.hash.match(/step-(\d+)-(\d+)/);

  for(var j = 0; j != steps.length; j++) {
    steps[j].index = j;
    steps[j].classList.toggle("current", locationStepHash == null && j == 0 || locationStepHash != null && locationStepHash[2] == j && locationStepHash[1] == steps[j].parentNode.index);
  }
  // Activate the current step from the location hash, or 0 if the step is not the appropriate one

  var step = stepContainer.querySelector("div.step[data-step-id='"+document.location.hash.substr(1)+"']");
  if(step == null) {
    step = stepContainer.querySelector("div.step");
  }
  var prevButton = document.createElement("button");
  prevButton.textContent = "Previous";
  var nextButton = document.createElement("button");
  nextButton.textContent = "Next";
  var progress = document.createElement("span");
  progress.classList.toggle("progress", true);
  stepContainer.insertBefore(progress, stepContainer.childNodes[0])
  stepContainer.insertBefore(nextButton, stepContainer.childNodes[0])
  stepContainer.insertBefore(prevButton, stepContainer.childNodes[0])
  function getCurrentStep() {
    return stepContainer.querySelector("div.step.current");
  }
  function getNextStep() {
    var currentStep = getCurrentStep();
    return currentStep.nextElementSibling != null && currentStep.nextElementSibling.matches("div.step") ?
          currentStep.nextElementSibling : null;
  }
  function getPrevStep() {
    var currentStep = getCurrentStep();
    return currentStep.previousElementSibling != null && currentStep.previousElementSibling.matches("div.step") ?
          currentStep.previousElementSibling : null;
  }
  function activate(step, yes = true) {
    step.classList.toggle("current", yes);
  }
  function disable(button, yes = true) {
    if(yes) {
      button.setAttribute("disabled", "");
    } else {
      button.removeAttribute("disabled");
    }
  }
  function getStepHash(step) {
    return "step-"+step.parentNode.index + "-"+step.index;
  }
  function renderButtons() {
    disable(prevButton, getPrevStep() == null);
    disable(nextButton, getNextStep() == null);
    progress.textContent = (getCurrentStep().index + 1) + " / " + steps.length;
    // Now we set the # in location to the current step, so that we can recover it if we reload the page
    var step = getCurrentStep();
    document.location.hash = getStepHash(step);
  }
  
  prevButton.onclick = function () {
    var currentStep = getCurrentStep();
    var prevStep = getPrevStep();
    if(prevStep != null) {
      activate(currentStep, false);
      activate(prevStep);
      renderButtons();
    }
  };
  var allButtons = stepContainer.querySelectorAll("button");
  for(var i = 0; i != allButtons.length; i++) {
    var button = allButtons[i];
    if(button.textContent == "Next") {
      button.onclick = ((scrollTop) => function () {
        var currentStep = getCurrentStep();
        var nextStep = getNextStep();
        if(nextStep != null) {
          function doSwitch() {
            activate(currentStep, false);
            activate(nextStep);
            renderButtons();
          }
          if(scrollTop) {
            stepContainer.scrollIntoView();
            setTimeout(doSwitch, 1000);
          } else {
            doSwitch();
          }
        }
      })(button.classList.contains("top"));
    }
  }
  renderButtons();
}

for(let i = 0; i != stepsContainers.length; i++) {
  stepsContainers[i].index = i;
  setUpStepContainer(stepsContainers[i]);
}