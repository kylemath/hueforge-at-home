p5.disableFriendlyErrors = true; //small performance boost
let img, copy, layer, layers, subd;
let color1Picker, color2Picker, color3Picker;
let totalLayersSlider;
let recomputeButton;
let transition1Slider, transition1SliderValue;
let transition2Slider, transition2SliderValue;
let transition3Slider, transition3SliderValue;
let colorToggle;

function preload() {
  let name = "fd.png";
  img = loadImage(name);
  copy = loadImage(name);
}

function setup() {
  createCanvas(400, 400);
  input = createFileInput(handleFile);
  input.position(0, 0);
  color1Picker = select("#color1");
  color2Picker = select("#color2");
  color3Picker = select("#color3"); // New color picker

  // Create the saveToggle checkbox
  saveToggle = createCheckbox("Show only copy image", false);
  saveToggle.position(370, 90); // Adjust position to the right of the transition sliders
  saveToggle.style("color", "#ffffff");
  saveToggle.changed(draw); // Redraw the canvas when the checkbox state changes

  //total layer slider
  totalLayersSlider = createSlider(1, 100, 15); // min: 1, max: 100, default: 20
  totalLayersSlider.position(20, 30);
  totalLayersSliderValue = createElement("h2");
  totalLayersSliderValue.position(5, 30);
  totalLayersSliderValue.style("color", "#ffffff");
  totalLayersSliderValue.html("Total Layers: " + totalLayersSlider.value());
  totalLayersSlider.input(() => {
    totalLayersSliderValue.html("Total Layers: " + totalLayersSlider.value());
    subd = parseInt(range / totalLayersSlider.value()); // Recalculate subd
    updateTransitionSlidersMax();
  });

  //recompute button
  recomputeButton = createButton("Recompute Image");
  recomputeButton.position(10, 90);
  recomputeButton.mousePressed(recomputeImage);

  colorToggle = createCheckbox("Use three colors", false);
  colorToggle.position(370, 110);
  colorToggle.style("color", "#ffffff");

  colorToggle.changed(toggleColors);

  //Transition Sliders
  let layers = totalLayersSlider.value();
  transition1Slider = createSlider(1, layers, 3); // min: 1, max: layers, default: 3
  transition1Slider.position(200, 30);
  transition1SliderValue = createElement("h2");
  transition1SliderValue.position(370, 10);
  transition1SliderValue.style("color", "#ffffff");
  transition1SliderValue.html("Transition 1: " + transition1Slider.value());

  transition1Slider.input(() => {
    transition1SliderValue.html("Transition 1: " + transition1Slider.value());
  });

  transition2Slider = createSlider(1, layers, 6); // min: 1, max: layers, default: 11
  transition2Slider.position(200, 50);
  transition2SliderValue = createElement("h2");
  transition2SliderValue.position(370, 30);
  transition2SliderValue.style("color", "#ffffff");
  transition2SliderValue.html("Transition 2: " + transition2Slider.value());

  transition2Slider.input(() => {
    transition2SliderValue.html("Transition 2: " + transition2Slider.value());
  });

  transition3Slider = createSlider(1, layers, 9); // min: 1, max: layers, default: 19
  transition3Slider.position(200, 70); // Position adjusted to be under the other sliders

  transition3SliderValue = createElement("h2");
  transition3SliderValue.position(370, 50); // Position adjusted to be under the other sliders
  transition3SliderValue.style("color", "#ffffff");
  transition3SliderValue.html("Transition 3: " + transition3Slider.value());
  transition3Slider.input(() => {
    transition3SliderValue.html("Transition 3: " + transition3Slider.value());
  });
}

function updateTransitionSlidersMax() {
  let layers = totalLayersSlider.value();
  transition1Slider.elt.max = layers;
  transition2Slider.elt.max = layers;
  transition3Slider.elt.max = layers;
}

function imageReady() {
  layer = 1;

  use_gray = true; // WIP for working with hue threshold
  range = use_gray ? 255 : 360; // rgb vs hue ranges
  factor = 1; // scaling factor for images, use 2 or more if it takes too long
  layers = 15; // stl model layers
  layer = 1;
  base_color = "black";

  subd = parseInt(range / layers);
  img.resize(img.width / factor, img.height / factor);
  copy.resize(copy.width / factor, copy.height / factor);
  img.loadPixels();
  copy.loadPixels();
  createCanvas(img.width * 2 + 20, img.height);
}

function toggleColors() {
  if (colorToggle.checked()) {
    // Checkbox is checked, show the fourth slider
    transition3Slider.show();
    transition3SliderValue.show();
  } else {
    // Checkbox is unchecked, hide the fourth slider
    transition3Slider.hide();
    transition3SliderValue.hide();
  }
}

function handleFile(file) {
  if (file.type === "image") {
    img = loadImage(file.data, imageReady);
    copy = loadImage(file.data, imageReady);
  } else {
    img = null;
    copy = null;
  }
}
function recomputeImage() {
  // Reset the layer variable to 1
  layer = 1;
}

function draw() {
  if (saveToggle.checked()) {
    // If the checkbox is checked, resize the canvas to fit only the copy image
    resizeCanvas(copy.width, copy.height);
    image(copy, 0, 0);
  } else {
    // If the checkbox is unchecked, resize the canvas to fit both the original and copy images
    resizeCanvas(img.width * 2 + 20, img.height);
    image(img, img.width + 20, 0);
    image(copy, 0, 0);
  }

  let color1 = color1Picker.value();
  let color2 = color2Picker.value();
  let color3 = color3Picker.value(); // New color

  let layers = totalLayersSlider.value();
  // Get the values of the sliders
  let transition1 = transition1Slider.value();
  let transition2 = transition2Slider.value();
  let transition3 = transition3Slider.value();

  if (layer <= layers) {
    let thresh = parseInt(subd * (layer - 1)); // threshold to change pixels
    for (i = 0; i < copy.pixels.length; i += 4) {
      if (img.pixels[i + 3] == 0) continue; // skip on transparent pixels for png files

      if (layer == 1) {
        // the origin color for the color mix. After the first layer, it is the current image's color
        orig_color = color(base_color);
      } else {
        orig_color = color(
          copy.pixels[i],
          copy.pixels[i + 1],
          copy.pixels[i + 2]
        );
      }

      if (use_gray) {
        current_value =
          (img.pixels[i] + img.pixels[i + 1] + img.pixels[i + 2]) / 3;
      } else {
        let c = color(img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]);
        current_value = hue(c);
      }

      if (current_value >= thresh) {
        let mixFactor = 0.3; // Variable for mix factor

        // use this switch-case to setup your layer changes. Add or remove layers and set mix-factor as you wish
        if (colorToggle.checked()) {
          // Checkbox is checked, use three colors
          switch (true) {
            case layer <= 1:
              current_color = [base_color, mixFactor];
              break;
            case layer <= transition1:
              current_color = [color1, mixFactor];
              break;
            case layer <= transition2:
              current_color = [color2, mixFactor];
              break;
            case layer <= transition3:
              current_color = [color3, mixFactor]; // New color
              break;
            case layer <= layers:
              current_color = ["white", mixFactor];
              break;
          }
        } else {
          // Checkbox is unchecked, use two colors
          switch (true) {
            case layer <= 1:
              current_color = [base_color, 0.5];
              break;
            case layer <= transition1:
              current_color = [color1, 0.5];
              break;
            case layer <= transition2:
              current_color = [color2, 0.2];
              break;
            case layer <= layers:
              current_color = ["white", 0.5];
              break;
          }
        }
        color_layer(current_color);
      }
    }

    console.log("Layer " + layer + ", with " + current_color);
    copy.updatePixels();
    image(copy, 0, 0);
    if (saveToggle.checked()) {
      image(copy, 0, 0);
    } else {
      image(img, img.width + 20, 0);
      image(copy, 0, 0);
    }
    layer++;
  }
}

function color_layer(c_color) {
  dest_color = color(c_color[0]);
  result = mixbox.lerp(orig_color.levels, dest_color.levels, c_color[1]); // color mix using mixbox for accurate pigment mixing results
  copy.pixels[i + 0] = result[0];
  copy.pixels[i + 1] = result[1];
  copy.pixels[i + 2] = result[2];
}
