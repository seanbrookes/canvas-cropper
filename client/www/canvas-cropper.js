
var CanvasCropper = (function() {
  this.cropIt = function() {
    var quality = 0.7;
    var output = mainCanvas.toDataURL('image/jpeg', quality);
    var textArea = document.getElementById('Output');
    textArea.value = output;
    document.getElementById("imageid").style.display='block';
    document.getElementById("Output").style.display='block';
    mainCanvas.style.display='none';
    document.getElementById("controls").style.display='none';
    document.getElementById("ImageMetrics").style.display='none';
    frameCanvas.style.display='none';
    document.getElementById("imageid").src=output;


  }



  var getMouseRef = function(event, element) {
    var offsetX = 0, offsetY = 0, mx, my;
    if (element && element.offsetParent) {
      // Compute the total offset
      if (element.offsetParent !== undefined) {
        do {
          offsetX += element.offsetLeft;
          offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
      }
      mx = event.pageX - offsetX;
      my = event.pageY - offsetY;
    }
    return {x: mx, y: my};

  };


  var mainCanvas = document.getElementById('MainCanvas');  // Main Canvas for cropping images
  var frameCanvas = document.getElementById('FrameCanvas'); // Guide Canvas indicating state of zoom and scroll
  var scaleSlider = document.getElementById('ScaleSlider'); // Zoom scale control

  var mainContext;
  var guideContext;
  var w, h; // global main canvas target width and height
  var workingCanvas; // working canvas (virtual)
  var workingContext; // working context
  var dragging = false; // flag indicating if draggin is active (mouse down within canvas)
  var orientation = 'landscape'; // default orientation
  var image; // working image
  var mouseZeroY; // y origin for mouse drag events
  var currentMaxY;  // originY * scale percent
  var scale, minimumScale, maximumScale, scalePercent; // slider constraints
  var originY; // y coordinate of fresh source image
  var srcXCoord, srcYCoord;  // x and y coordinates within working canvas of source of sample slice
  var scaledWidth; // width of scaled image
  var scaledHeight;// heigth of scaled image
  var shrinkLimit = false; // if either width or height of scaled image matches the main canvas dimensions
  var guideCurrY;  // where the frame guide is vertically

  document.getElementById("ImageMetrics").style.display='none';
  document.getElementById("ScaleSlider").style.display='none';
  document.getElementById("CropButton").style.display='none';
  document.getElementById("ResetButton").style.display='none';

  document.getElementById("Output").style.display='none';
  document.getElementById("imageid").style.display='none';
  w = mainCanvas.width;
  h = mainCanvas.height;

  function setOrientation() {
    if (image && image.width) {
      orientation = 'landscape';
      if (image.width < image.height) {
        orientation = 'portrait';
      }
    }
  }
  this.reset = function() {
    document.location.reload();
  }
// once image is loaded
  function initEditorView() {
    shrinkLimit = false;
    scalePercent = 0;
    setOrientation();

    dragging = false;
    mainContext = mainCanvas.getContext('2d');
    guideContext = frameCanvas.getContext('2d');
    workingCanvas = document.createElement('canvas');
    workingContext = workingCanvas.getContext('2d');
    scaleSlider.max = image.width;
    scaleSlider.value = image.width;
    scaleSlider.min = w;
    minimumScale = w;
    scaledWidth = image.width;
    scaledHeight = image.height;
    originY = ((image.height - mainCanvas.height) / 2 ) * -1;
    originX = ((image.width - mainCanvas.width) / 2 ) * -1;
    mainContext.clearRect(0, 0, w, h);

    document.getElementById('Output').value = '';
    document.getElementById("controls").style.display='block';
    document.getElementById("ImageMetrics").style.display='block';
    document.getElementById("ScaleSlider").style.display='inline-block';
    document.getElementById("CropButton").style.display='inline-block';
    document.getElementById("ResetButton").style.display='inline-block';
    mainCanvas.style.display='block';
    frameCanvas.style.display='block';
  }




  function updateStats() {
    var scaleInstrument = document.getElementById('scaleOutput');
    scaleInstrument.innerHTML = scale;  var scaledWidthEl = document.getElementById('scaledWidth');
    scaledWidthEl.innerHTML = scaledWidth;
    var scaledHeightEl = document.getElementById('scaledHeight');
    scaledHeightEl.innerHTML = scaledHeight;
    var sourceWidth = document.getElementById('sourceWidth');
    sourceWidth.innerHTML = image.width;
    var sourceHeight = document.getElementById('sourceHeight');
    sourceHeight.innerHTML = image.height;
    var scaleLimitEl = document.getElementById('scaleLimit');
    scaleLimitEl.innerHTML = scaleLimit;
    var scalePercentEl = document.getElementById('scalePercent');
    scalePercentEl.innerHTML = scalePercent;
  }











  function drawMainCanvas() {
    mainContext.clearRect(0, 0, w, h);
    mainContext.drawImage(workingCanvas, srcXCoord, srcYCoord, w, h, 0, 0, w, h);
  }



  function zoomScale() {
    scale = scaleSlider.value;

    if (scale <= w) {
      scale = w;
      scaleLimit = scale;
      shrinkLimit = true;
    }
    if (scale > w) {
      shrinkLimit = false;
    }


    if (scale > scaleLimit) {
      shrinkLimit = false;
    }


    if (!shrinkLimit) {
      scalePercent = (scale / scaleSlider.max);
      scaledWidth = image.width * scalePercent;
      scaledHeight = image.height * scalePercent;
    }


    if (scaledWidth < w) {
      shrinkLimit = true;
      if (!scaleLimit) {
        scaleLimit = scale;
      }
      scaledWidth = w;
    }
    else {
      if (scaledHeight > h) {
        shrinkLimit = false;
      }
    }
    if (scaledHeight < h) {
      shrinkLimit = true;
      if (!scaleLimit) {
        scaleLimit = scale;
      }
      scaledHeight = h;
    }
    else {
      if (scaledWidth > w) {
        shrinkLimit = false;
      }
    }

    if (!shrinkLimit) {
      workingCanvas.width = scaledWidth;
      workingCanvas.height = scaledHeight;

      workingContext.clearRect(0, 0, scaledWidth, scaledHeight);
      workingContext.drawImage(image, 0, 0, scaledWidth, scaledHeight);

      srcYCoord = (scaledHeight - h) / 2;
      srcXCoord = (scaledWidth - w) / 2;

      drawMainCanvas();
      scrollFrameGuide();
      updateInstrumentationCanvas();
      updateStats();
    }

  }

  function scrollImage(y) {
    currentMaxY = scaledHeight - mainCanvas.height;
    if ((srcYCoord > 0) && (srcYCoord < currentMaxY)) {
      drawMainCanvas();
      drawFrameCanvas();
    }
  }

  function scrollFrameGuide() {
    var guideDisplayWidth = 300;
    var guideDisplayHeight = 200;
    if (orientation === 'portrait') {
      guideDisplayWidth = 200;
      guideDisplayHeight = 300;
    }
    var guideRectWidth = (w / scaledWidth) * guideDisplayWidth;
    var guideRectHeight = (h / scaledHeight) * guideDisplayHeight;

    var guideMaxY = (guideDisplayHeight - guideRectHeight);
    var guideRatio = (srcYCoord * -1) / (scaledHeight - h);
    guideCurrY = guideMaxY * (guideRatio * -1);


    if (guideCurrY > guideMaxY) {
      guideCurrY = guideMaxY;
    }
    if (guideCurrY < 0) {
      guideCurrY = 0;
    }

  }

  function drawFrameCanvas() {
    var guideDisplayWidth = 300;
    var guideDisplayHeight = 200;
    if (orientation === 'portrait') {
      guideDisplayWidth = 200;
      guideDisplayHeight = 300;
    }
    guideContext.clearRect(0, 0, 300, 300);
    guideContext.drawImage(workingCanvas, 0,0,guideDisplayWidth,guideDisplayHeight);

    // process guide image
    var imageData = guideContext.getImageData(0, 0, guideDisplayWidth, guideDisplayHeight);
    var data = imageData.data;
    var length = data.length;
    for(var idx = 0; idx < length; idx+=4){
      data[idx + 3] = 100;
    }
    guideContext.putImageData(imageData, 0, 0);
    // end draw guide image

    var guideRectWidth = (w / scaledWidth) * guideDisplayWidth;
    var guideRectHeight = (h / scaledHeight) * guideDisplayHeight;
    var guideX = (guideDisplayWidth - guideRectWidth) / 2;



    var guideMaxY = (guideDisplayHeight - guideRectHeight);
    var guideRatio = (srcYCoord * -1) / (scaledHeight - h);
    guideCurrY = guideMaxY * (guideRatio * -1);

    guideContext.fillStyle = "rgba(10,110,220, .45)";
    guideContext.fillRect(guideX, guideCurrY, guideRectWidth, guideRectHeight);

  }

  function updateInstrumentationCanvas(guideY) {
    var guideDisplayWidth = 300;
    var guideDisplayHeight = 200;
    if (orientation === 'portrait') {
      guideDisplayWidth = 200;
      guideDisplayHeight = 300;
    }
    guideContext.clearRect(0, 0, 300, 300);
    guideContext.drawImage(workingCanvas, 0,0,guideDisplayWidth,guideDisplayHeight);
    //
    //// process guide image
    var imageData = guideContext.getImageData(0, 0, guideDisplayWidth, guideDisplayHeight);
    var data = imageData.data;
    var length = data.length;
    for(var idx = 0; idx < length; idx+=4){
      data[idx + 3] = 100;
    }
    guideContext.putImageData(imageData, 0, 0);
    //end draw guide image

    var guideRectWidth = (w / scaledWidth) * guideDisplayWidth;
    var guideRectHeight = (h / scaledHeight) * guideDisplayHeight;
    var guideX = (guideDisplayWidth - guideRectWidth) / 2;

    var guideMaxY = (guideDisplayHeight - guideRectHeight);

    guideContext.fillStyle = "rgba(10,110,220, .45)";
    guideContext.fillRect(guideX, guideCurrY, guideRectWidth, guideRectHeight);

  }

  function updateRange(e) {
    scale = Number(e.target.value);
    if (scale < scaleSlider.min) {
      scale = scaleSlider.min;
      scaleSlider.value = scale;
    }
    else if (scale > scaleSlider.max) {
      scale = scaleSlider.max;
      scaleSlider.value = scale;
    }
    zoomScale();
  }

// Initialization................................................
  function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    var theFile = files[0];

    var reader = new FileReader();
    reader.onload = function(event) {
      image = new Image();

      image.onload = function (e) {
        if (image.width < w) {
          console.warn('this image is not very big and will be stretched consider using a larger one');
          var delta = w - image.width;
          var percent = delta / w;
          image.width = w;
          image.height = (1 + percent) * image.height;
        }
        if (image.height < h) {
          var delta2 = h - image.height;
          var percent2 = delta2 / w;
          image.width = (1 + percent2) * image.width;
          image.height = (1 + percent2) * image.height;

          image.height = h;
        }
        initEditorView();
        zoomScale();
        drawFrameCanvas();
      };
      image.src = reader.result;

    };
    reader.readAsDataURL(theFile);

  }



// assign event handlers
  scaleSlider.oninput = updateRange;

  mainCanvas.addEventListener('mouseup', function(e) {
    dragging = false;
  }, true);
  document.addEventListener('mouseup', function(e) {
    dragging = false;
  }, true);

//fixes a problem where double clicking causes text to get selected on the canvas
  mainCanvas.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
  }, false);


// Up, down, and move are for dragging
  mainCanvas.addEventListener('mousedown', function(e) {
    var mouse = getMouseRef(e, mainCanvas);
    dragging = true;
    mouseZeroY = mouse.y;
  }, true);


  mainCanvas.addEventListener('mousemove', function(e) {
    if (dragging){
      var mouse = getMouseRef(e, mainCanvas);
      if (mouse.y > mouseZeroY) {
        srcYCoord = srcYCoord - 5;
      }
      else {
        srcYCoord = srcYCoord + 5;
      }
      scrollImage();
    }
  }, true);













  frameCanvas.addEventListener('mouseup', function(e) {
    dragging = false;
  }, true);
  document.addEventListener('mouseup', function(e) {
    dragging = false;
  }, true);

//fixes a problem where double clicking causes text to get selected on the canvas
  frameCanvas.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
  }, false);


// Up, down, and move are for dragging
  frameCanvas.addEventListener('mousedown', function(e) {
    var mouse = getMouseRef(e, frameCanvas);
    dragging = true;
    mouseZeroY = mouse.y;
  }, true);


  frameCanvas.addEventListener('mousemove', function(e) {
    console.log('| dragging', dragging);
    if (dragging){
      var mouse = getMouseRef(e, frameCanvas);
      if (mouse.y > mouseZeroY) {
        if (srcYCoord < currentMaxY) {
          guideCurrY = guideCurrY + 2;
          srcYCoord = srcYCoord + 5;
        }
        else {
          guideCurrY = guideCurrY;
          srcYCoord = srcYCoord;
        }

      }
      else {
        if (srcYCoord > 0) {
          guideCurrY = guideCurrY - 2;
          srcYCoord = srcYCoord - 5;
        }
        else {
          guideCurrY = guideCurrY;
          srcYCoord = srcYCoord;
        }
      }
      updateInstrumentationCanvas(guideCurrY);
      scrollImage();
    }
  }, true);







  document.getElementById('files').addEventListener('change', handleFileSelect, false);
}());





