$("#image-selector").change(function () {
    let reader = new FileReader(); //we create reader object to allow the web app to read the contents of selected file 
    reader.onload = function () { //onload handler which will be trigerred when the reader successfully reads the content of the file
        let dataURL = reader.result; //contains image data as URL that represents the file data as a base64 encoded string
        $("#selected-image").attr("src", dataURL); //setting source value of selected image to value of data URL
        $("#prediction-list").empty(); //lastly within the onload handler we need to get rid of any previous predictions that were being displayed for previous images
    }
    let file = $("#image-selector").prop("files")[0]; //next we get the selected files from the image selector &
    reader.readAsDataURL(file); //load the image by calling read as data url on reader & passing in the selected image file
});

$("#model-selector").change(function () {
    loadModel($("#model-selector").val());
});

let model; // instantiate the model variable & we are going to define it directly below
//Here we have IIFE or immediately invoked function expression. An IIFE is function that runs as soon as it's defined
async function loadModel(name) { //wrapping function
    $(".progress-bar").show();
    model = undefined;
    model = await tf.loadModel(`http://localhost:81/tfjs-models/${name}/model.json`);
    //tf.loadModel returns a promise meaning that this function promises to return the model at some point in future
    //the await keyword pauses the execution of this wrapping function until the promise is resolved & model is loaded.
    // This is why we use async keyword when defining the function because if we want to use the await keyword
    // then it has to be contained within an async function
    $(".progress-bar").hide(); //hiding the progress bar from the UI which indicates that the model is loaded
}

$("#predict-button").click(async function () {
    let image = $("#selected-image").get(0);  //when the user clicks the predict button, we first get the image from selected image element
    // then we need to transform the image into rank for tensor object of floats with height & width  dimension of 224 x 224. model expects that
    let modelName = $("#model-selector").val();
    let tensor = preprocessImage(image, modelName);

    //prediction made up of array of 1000 elements, each of which corresponds to probability for an individual imagenet class
    //Each index in array maps to specific imagenet class
    let predictions = await model.predict(tensor).data();
    let top5 = Array.from(predictions)
        .map(function (p, i) {  //mapping prediction values to corresponding imagenet classes
            return { //for each prediction in array we return the javascript object that contains the probability and the imagenet class name
                probability: p,
                className: IMAGENET_CLASSES[i]
            };
        }).sort(function (a, b) {
            return b.probability - a.probability;
        }).slice(0, 5);

    $("#prediction-list").empty();
    top5.forEach(function (p) {
        $("#prediction-list").append(`<li>${p.className}: ${p.probability.toFixed(6)}</li>`);
    });
});


//During training of vgg16, the input to our ConvNets is a fixed-size224×224RGB image.
//The only pre-processing we do is subtracting the mean RGB value, computedon the training set, from each pixel.
//Training set is Imagenet. for single channel like Red R- avg(R) = centered R in each pixel. Same goes for green & blue
//This technique is called zero centering because it forces the mean of given dataset to be zero
//So we are zero centering each color channel w.r.t. to imagenet dataset
//The author trained vgg16 using the caffe library which uses a BGR color scheme for reading images rather than RGB
//So second preprocessing is reverse the order from RGB --> BGR
function preprocessImage(image, modelName) {
    let tensor = tf.fromPixels(image)
        .resizeNearestNeighbor([224, 224])
        .toFloat();

    if (modelName === undefined) {
        return tensor.expandDims();
    }
    else if (modelName === "VGG16") {
        let meanImageNetRGB = tf.tensor1d([123.68, 116.779, 103.939]);
        return tensor.sub(meanImageNetRGB) //Subtracting meanImageNetRGB from original tensor
            .reverse(2) //Reverse RGB values
            .expandDims(); //expand the dimensions
    }
    else if (modelName === "MobileNet") { 
        //The images that mobilenet was originally trained on were preprocessed so that RGB
        //values were scaled down from a scale of 0 to 255 to a scale of -1 to 1
        let offset = tf.scalar(127.5); //scalar value. Half of 255
        return tensor.sub(offset) //subtracting scalar from original tensor
            .div(offset) //& divide that result by the scalar
            .expandDims();
    }
    else {
        throw new Error("Unknown model name");
    }
}