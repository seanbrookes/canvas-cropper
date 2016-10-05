# canvas-cropper

canvas-cropper is a HTML5 canvas based image upload and crop UI

The UI features:

- a 'crop' window
- a frame view
- zoom (and other controls)
- a hidden 'working' canvas element

![](https://raw.githubusercontent.com/seanbrookes/canvas-cropper/master/documentation/images/crop-ui.png)

After the user uploads an image:
- it is 'drawn' into the working canvas at full width and height
- a 'slice' the size of the main canvas width and height is drawn into the main canvas (crop window)
- when the user uses the range slider the image is scaled up or down
- this triggers another cycle of:
-- clearing the working-canvas
-- drawing the new scaled image onto the canvas
-- taking a new slice and writing to the crop window canvas (main canvas)
- the user can drag the image in the crop view up or down to change the y coordinate of the crop view
- the user can also drag the frame view up and down to change the vertical location of the slice

![](https://raw.githubusercontent.com/seanbrookes/canvas-cropper/master/documentation/images/working-canvas.png)


Note this version doesn't support lateral dragging but is a priority
