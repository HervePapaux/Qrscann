/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import * as tslib_1 from "tslib";
/// <reference path="./image-capture.d.ts" />
/// <reference path="./image-capture.d.ts" />
import { BrowserMultiFormatReader, ChecksumException, FormatException, NotFoundException } from '@zxing/library';
import { BehaviorSubject } from 'rxjs';
/**
 * Based on zxing-typescript BrowserCodeReader
 */
export class BrowserMultiFormatContinuousReader extends BrowserMultiFormatReader {
    constructor() {
        super(...arguments);
        /**
         * Says if there's a torch available for the current device.
         */
        this._isTorchAvailable = new BehaviorSubject(undefined);
    }
    /**
     * Exposes _tochAvailable .
     * @return {?}
     */
    get isTorchAvailable() {
        return this._isTorchAvailable.asObservable();
    }
    /**
     * Starts the decoding from the current or a new video element.
     *
     * @param {?=} deviceId The device's to be used Id
     * @param {?=} videoSource A new video element
     * @return {?}
     */
    continuousDecodeFromInputVideoDevice(deviceId, videoSource) {
        this.reset();
        // Keeps the deviceId between scanner resets.
        if (typeof deviceId !== 'undefined') {
            this.deviceId = deviceId;
        }
        if (typeof navigator === 'undefined') {
            return;
        }
        /** @type {?} */
        const scan$ = new BehaviorSubject({});
        try {
            // this.decodeFromInputVideoDeviceContinuously(deviceId, videoSource, (result, error) => scan$.next({ result, error }));
            this.getStreamForDevice({ deviceId })
                .then((/**
             * @param {?} stream
             * @return {?}
             */
            stream => this.attachStreamToVideoAndCheckTorch(stream, videoSource)))
                .then((/**
             * @param {?} videoElement
             * @return {?}
             */
            videoElement => this.decodeOnSubject(scan$, videoElement, this.timeBetweenScansMillis)));
        }
        catch (e) {
            scan$.error(e);
        }
        this._setScanStream(scan$);
        // @todo Find a way to emit a complete event on the scan stream once it's finished.
        return scan$.asObservable();
    }
    /**
     * Gets the media stream for certain device.
     * Falls back to any available device if no `deviceId` is defined.
     * @param {?} __0
     * @return {?}
     */
    getStreamForDevice({ deviceId }) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            /** @type {?} */
            const constraints = this.getUserMediaConstraints(deviceId);
            /** @type {?} */
            const stream = yield navigator.mediaDevices.getUserMedia(constraints);
            return stream;
        });
    }
    /**
     * Creates media steram constraints for certain `deviceId`.
     * Falls back to any environment available device if no `deviceId` is defined.
     * @param {?} deviceId
     * @return {?}
     */
    getUserMediaConstraints(deviceId) {
        /** @type {?} */
        const video = typeof deviceId === 'undefined'
            ? { facingMode: { exact: 'environment' } }
            : { deviceId: { exact: deviceId } };
        /** @type {?} */
        const constraints = { video };
        return constraints;
    }
    /**
     * Enables and disables the device torch.
     * @param {?} on
     * @return {?}
     */
    setTorch(on) {
        if (!this._isTorchAvailable.value) {
            // compatibility not checked yet
            return;
        }
        /** @type {?} */
        const tracks = this.getVideoTracks(this.stream);
        if (on) {
            this.applyTorchOnTracks(tracks, true);
        }
        else {
            this.applyTorchOnTracks(tracks, false);
            // @todo check possibility to disable torch without restart
            this.restart();
        }
    }
    /**
     * Update the torch compatibility state and attachs the stream to the preview element.
     * @private
     * @param {?} stream
     * @param {?} videoSource
     * @return {?}
     */
    attachStreamToVideoAndCheckTorch(stream, videoSource) {
        this.updateTorchCompatibility(stream);
        return this.attachStreamToVideo(stream, videoSource);
    }
    /**
     * Checks if the stream supports torch control.
     *
     * @private
     * @param {?} stream The media stream used to check.
     * @return {?}
     */
    updateTorchCompatibility(stream) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            /** @type {?} */
            const tracks = this.getVideoTracks(stream);
            for (const track of tracks) {
                if (yield this.isTorchCompatible(track)) {
                    this._isTorchAvailable.next(true);
                    break;
                }
            }
        });
    }
    /**
     *
     * @private
     * @param {?} stream The video stream where the tracks gonna be extracted from.
     * @return {?}
     */
    getVideoTracks(stream) {
        /** @type {?} */
        let tracks = [];
        try {
            tracks = stream.getVideoTracks();
        }
        finally {
            return tracks || [];
        }
    }
    /**
     *
     * @private
     * @param {?} track The media stream track that will be checked for compatibility.
     * @return {?}
     */
    isTorchCompatible(track) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            /** @type {?} */
            let compatible = false;
            try {
                /** @type {?} */
                const imageCapture = new ImageCapture(track);
                /** @type {?} */
                const capabilities = yield imageCapture.getPhotoCapabilities();
                compatible = !!capabilities['torch'] || ('fillLightMode' in capabilities && capabilities.fillLightMode.length !== 0);
            }
            finally {
                return compatible;
            }
        });
    }
    /**
     * Apply the torch setting in all received tracks.
     * @private
     * @param {?} tracks
     * @param {?} state
     * @return {?}
     */
    applyTorchOnTracks(tracks, state) {
        tracks.forEach((/**
         * @param {?} track
         * @return {?}
         */
        track => track.applyConstraints({
            advanced: [(/** @type {?} */ ({ torch: state, fillLightMode: state ? 'torch' : 'none' }))]
        })));
    }
    /**
     * Correctly sets a new scanStream value.
     * @private
     * @param {?} scan$
     * @return {?}
     */
    _setScanStream(scan$) {
        // cleans old stream
        this._cleanScanStream();
        // sets new stream
        this.scanStream = scan$;
    }
    /**
     * Cleans any old scan stream value.
     * @private
     * @return {?}
     */
    _cleanScanStream() {
        if (this.scanStream && !this.scanStream.isStopped) {
            this.scanStream.complete();
        }
        this.scanStream = null;
    }
    /**
     * Decodes values in a stream with delays between scans.
     *
     * @private
     * @param {?} scan$ The subject to receive the values.
     * @param {?} videoElement The video element the decode will be applied.
     * @param {?} delay The delay between decode results.
     * @return {?}
     */
    decodeOnSubject(scan$, videoElement, delay) {
        // stops loop
        if (scan$.isStopped) {
            return;
        }
        /** @type {?} */
        let result;
        try {
            result = this.decode(videoElement);
            scan$.next({ result });
        }
        catch (error) {
            // stream cannot stop on fails.
            if (!error ||
                // scan Failure - found nothing, no error
                error instanceof NotFoundException ||
                // scan Error - found the QR but got error on decoding
                error instanceof ChecksumException ||
                error instanceof FormatException) {
                scan$.next({ error });
            }
            else {
                scan$.error(error);
            }
        }
        finally {
            /** @type {?} */
            const timeout = !result ? 0 : delay;
            setTimeout((/**
             * @return {?}
             */
            () => this.decodeOnSubject(scan$, videoElement, delay)), timeout);
        }
    }
    /**
     * Restarts the scanner.
     * @private
     * @return {?}
     */
    restart() {
        // reset
        // start
        return this.continuousDecodeFromInputVideoDevice(this.deviceId, this.videoElement);
    }
}
if (false) {
    /**
     * Says if there's a torch available for the current device.
     * @type {?}
     * @private
     */
    BrowserMultiFormatContinuousReader.prototype._isTorchAvailable;
    /**
     * The device id of the current media device.
     * @type {?}
     * @private
     */
    BrowserMultiFormatContinuousReader.prototype.deviceId;
    /**
     * If there's some scan stream open, it shal be here.
     * @type {?}
     * @private
     */
    BrowserMultiFormatContinuousReader.prototype.scanStream;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci1tdWx0aS1mb3JtYXQtY29udGludW91cy1yZWFkZXIuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Aenhpbmcvbmd4LXNjYW5uZXIvIiwic291cmNlcyI6WyJsaWIvYnJvd3Nlci1tdWx0aS1mb3JtYXQtY29udGludW91cy1yZWFkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw2Q0FBNkM7O0FBRTdDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsaUJBQWlCLEVBQVUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6SCxPQUFPLEVBQUUsZUFBZSxFQUFjLE1BQU0sTUFBTSxDQUFDOzs7O0FBTW5ELE1BQU0sT0FBTyxrQ0FBbUMsU0FBUSx3QkFBd0I7SUFBaEY7Ozs7O1FBWVUsc0JBQWlCLEdBQUcsSUFBSSxlQUFlLENBQVUsU0FBUyxDQUFDLENBQUM7SUEyT3RFLENBQUM7Ozs7O0lBbFBDLElBQVcsZ0JBQWdCO1FBQ3pCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFlBQVksRUFBRSxDQUFDO0lBQy9DLENBQUM7Ozs7Ozs7O0lBd0JNLG9DQUFvQyxDQUN6QyxRQUFpQixFQUNqQixXQUE4QjtRQUc5QixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFYiw2Q0FBNkM7UUFDN0MsSUFBSSxPQUFPLFFBQVEsS0FBSyxXQUFXLEVBQUU7WUFDbkMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7U0FDMUI7UUFFRCxJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsRUFBRTtZQUNwQyxPQUFPO1NBQ1I7O2NBRUssS0FBSyxHQUFHLElBQUksZUFBZSxDQUFpQixFQUFFLENBQUM7UUFFckQsSUFBSTtZQUNGLHdIQUF3SDtZQUN4SCxJQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQztpQkFDbEMsSUFBSTs7OztZQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxD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UUFFbEIsSUFBSTtZQUNGLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ25DLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1NBQ3hCO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCwrQkFBK0I7WUFDL0IsSUFDRSxDQUFDLEtBQUs7Z0JBQ04seUNBQXlDO2dCQUN6QyxLQUFLLFlBQVksaUJBQWlCO2dCQUNsQyxzREFBc0Q7Z0JBQ3RELEtBQUssWUFBWSxpQkFBaUI7Z0JBQ2xDLEtBQUssWUFBWSxlQUFlLEVBQ2hDO2dCQUNBLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2FBQ3ZCO2lCQUFNO2dCQUNMLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDcEI7U0FDRjtnQkFBUzs7a0JBQ0YsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7WUFDbkMsVUFBVTs7O1lBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxHQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzdFO0lBQ0gsQ0FBQzs7Ozs7O0lBS08sT0FBTztRQUNiLFFBQVE7UUFDUixRQUFRO1FBQ1IsT0FBTyxJQUFJLENBQUMsb0NBQW9DLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDckYsQ0FBQztDQUVGOzs7Ozs7O0lBM09DLCtEQUFvRTs7Ozs7O0lBS3BFLHNEQUF5Qjs7Ozs7O0lBS3pCLHdEQUFvRCIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2ltYWdlLWNhcHR1cmUuZC50c1wiIC8+XHJcblxyXG5pbXBvcnQgeyBCcm93c2VyTXVsdGlGb3JtYXRSZWFkZXIsIENoZWNrc3VtRXhjZXB0aW9uLCBGb3JtYXRFeGNlcHRpb24sIE5vdEZvdW5kRXhjZXB0aW9uLCBSZXN1bHQgfSBmcm9tICdAenhpbmcvbGlicmFyeSc7XHJcbmltcG9ydCB7IEJlaGF2aW9yU3ViamVjdCwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBSZXN1bHRBbmRFcnJvciB9IGZyb20gJy4vUmVzdWx0QW5kRXJyb3InO1xyXG5cclxuLyoqXHJcbiAqIEJhc2VkIG9uIHp4aW5nLXR5cGVzY3JpcHQgQnJvd3NlckNvZGVSZWFkZXJcclxuICovXHJcbmV4cG9ydCBjbGFzcyBCcm93c2VyTXVsdGlGb3JtYXRDb250aW51b3VzUmVhZGVyIGV4dGVuZHMgQnJvd3Nlck11bHRpRm9ybWF0UmVhZGVyIHtcclxuXHJcbiAgLyoqXHJcbiAgICogRXhwb3NlcyBfdG9jaEF2YWlsYWJsZSAuXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBpc1RvcmNoQXZhaWxhYmxlKCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2lzVG9yY2hBdmFpbGFibGUuYXNPYnNlcnZhYmxlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTYXlzIGlmIHRoZXJlJ3MgYSB0b3JjaCBhdmFpbGFibGUgZm9yIHRoZSBjdXJyZW50IGRldmljZS5cclxuICAgKi9cclxuICBwcml2YXRlIF9pc1RvcmNoQXZhaWxhYmxlID0gbmV3IEJlaGF2aW9yU3ViamVjdDxib29sZWFuPih1bmRlZmluZWQpO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgZGV2aWNlIGlkIG9mIHRoZSBjdXJyZW50IG1lZGlhIGRldmljZS5cclxuICAgKi9cclxuICBwcml2YXRlIGRldmljZUlkOiBzdHJpbmc7XHJcblxyXG4gIC8qKlxyXG4gICAqIElmIHRoZXJlJ3Mgc29tZSBzY2FuIHN0cmVhbSBvcGVuLCBpdCBzaGFsIGJlIGhlcmUuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzY2FuU3RyZWFtOiBCZWhhdmlvclN1YmplY3Q8UmVzdWx0QW5kRXJyb3I+O1xyXG5cclxuICAvKipcclxuICAgKiBTdGFydHMgdGhlIGRlY29kaW5nIGZyb20gdGhlIGN1cnJlbnQgb3IgYSBuZXcgdmlkZW8gZWxlbWVudC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBjYWxsYmFja0ZuIFRoZSBjYWxsYmFjayB0byBiZSBleGVjdXRlZCBhZnRlciBldmVyeSBzY2FuIGF0dGVtcHRcclxuICAgKiBAcGFyYW0gZGV2aWNlSWQgVGhlIGRldmljZSdzIHRvIGJlIHVzZWQgSWRcclxuICAgKiBAcGFyYW0gdmlkZW9Tb3VyY2UgQSBuZXcgdmlkZW8gZWxlbWVudFxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb250aW51b3VzRGVjb2RlRnJvbUlucHV0VmlkZW9EZXZpY2UoXHJcbiAgICBkZXZpY2VJZD86IHN0cmluZyxcclxuICAgIHZpZGVvU291cmNlPzogSFRNTFZpZGVvRWxlbWVudFxyXG4gICk6IE9ic2VydmFibGU8UmVzdWx0QW5kRXJyb3I+IHtcclxuXHJcbiAgICB0aGlzLnJlc2V0KCk7XHJcblxyXG4gICAgLy8gS2VlcHMgdGhlIGRldmljZUlkIGJldHdlZW4gc2Nhbm5lciByZXNldHMuXHJcbiAgICBpZiAodHlwZW9mIGRldmljZUlkICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICB0aGlzLmRldmljZUlkID0gZGV2aWNlSWQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzY2FuJCA9IG5ldyBCZWhhdmlvclN1YmplY3Q8UmVzdWx0QW5kRXJyb3I+KHt9KTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAvLyB0aGlzLmRlY29kZUZyb21JbnB1dFZpZGVvRGV2aWNlQ29udGludW91c2x5KGRldmljZUlkLCB2aWRlb1NvdXJjZSwgKHJlc3VsdCwgZXJyb3IpID0+IHNjYW4kLm5leHQoeyByZXN1bHQsIGVycm9yIH0pKTtcclxuICAgICAgdGhpcy5nZXRTdHJlYW1Gb3JEZXZpY2UoeyBkZXZpY2VJZCB9KVxyXG4gICAgICAgIC50aGVuKHN0cmVhbSA9PiB0aGlzLmF0dGFjaFN0cmVhbVRvVmlkZW9BbmRDaGVja1RvcmNoKHN0cmVhbSwgdmlkZW9Tb3VyY2UpKVxyXG4gICAgICAgIC50aGVuKHZpZGVvRWxlbWVudCA9PiB0aGlzLmRlY29kZU9uU3ViamVjdChzY2FuJCwgdmlkZW9FbGVtZW50LCB0aGlzLnRpbWVCZXR3ZWVuU2NhbnNNaWxsaXMpKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgc2NhbiQuZXJyb3IoZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fc2V0U2NhblN0cmVhbShzY2FuJCk7XHJcblxyXG4gICAgLy8gQHRvZG8gRmluZCBhIHdheSB0byBlbWl0IGEgY29tcGxldGUgZXZlbnQgb24gdGhlIHNjYW4gc3RyZWFtIG9uY2UgaXQncyBmaW5pc2hlZC5cclxuXHJcbiAgICByZXR1cm4gc2NhbiQuYXNPYnNlcnZhYmxlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBtZWRpYSBzdHJlYW0gZm9yIGNlcnRhaW4gZGV2aWNlLlxyXG4gICAqIEZhbGxzIGJhY2sgdG8gYW55IGF2YWlsYWJsZSBkZXZpY2UgaWYgbm8gYGRldmljZUlkYCBpcyBkZWZpbmVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhc3luYyBnZXRTdHJlYW1Gb3JEZXZpY2UoeyBkZXZpY2VJZCB9OiBQYXJ0aWFsPE1lZGlhRGV2aWNlSW5mbz4pOiBQcm9taXNlPE1lZGlhU3RyZWFtPiB7XHJcbiAgICBjb25zdCBjb25zdHJhaW50cyA9IHRoaXMuZ2V0VXNlck1lZGlhQ29uc3RyYWludHMoZGV2aWNlSWQpO1xyXG4gICAgY29uc3Qgc3RyZWFtID0gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoY29uc3RyYWludHMpO1xyXG4gICAgcmV0dXJuIHN0cmVhbTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgbWVkaWEgc3RlcmFtIGNvbnN0cmFpbnRzIGZvciBjZXJ0YWluIGBkZXZpY2VJZGAuXHJcbiAgICogRmFsbHMgYmFjayB0byBhbnkgZW52aXJvbm1lbnQgYXZhaWxhYmxlIGRldmljZSBpZiBubyBgZGV2aWNlSWRgIGlzIGRlZmluZWQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFVzZXJNZWRpYUNvbnN0cmFpbnRzKGRldmljZUlkOiBzdHJpbmcpOiBNZWRpYVN0cmVhbUNvbnN0cmFpbnRzIHtcclxuXHJcbiAgICBjb25zdCB2aWRlbyA9IHR5cGVvZiBkZXZpY2VJZCA9PT0gJ3VuZGVmaW5lZCdcclxuICAgICAgPyB7IGZhY2luZ01vZGU6IHsgZXhhY3Q6ICdlbnZpcm9ubWVudCcgfSB9XHJcbiAgICAgIDogeyBkZXZpY2VJZDogeyBleGFjdDogZGV2aWNlSWQgfSB9O1xyXG5cclxuICAgIGNvbnN0IGNvbnN0cmFpbnRzOiBNZWRpYVN0cmVhbUNvbnN0cmFpbnRzID0geyB2aWRlbyB9O1xyXG5cclxuICAgIHJldHVybiBjb25zdHJhaW50cztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVuYWJsZXMgYW5kIGRpc2FibGVzIHRoZSBkZXZpY2UgdG9yY2guXHJcbiAgICovXHJcbiAgcHVibGljIHNldFRvcmNoKG9uOiBib29sZWFuKTogdm9pZCB7XHJcblxyXG4gICAgaWYgKCF0aGlzLl9pc1RvcmNoQXZhaWxhYmxlLnZhbHVlKSB7XHJcbiAgICAgIC8vIGNvbXBhdGliaWxpdHkgbm90IGNoZWNrZWQgeWV0XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0cmFja3MgPSB0aGlzLmdldFZpZGVvVHJhY2tzKHRoaXMuc3RyZWFtKTtcclxuXHJcbiAgICBpZiAob24pIHtcclxuICAgICAgdGhpcy5hcHBseVRvcmNoT25UcmFja3ModHJhY2tzLCB0cnVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuYXBwbHlUb3JjaE9uVHJhY2tzKHRyYWNrcywgZmFsc2UpO1xyXG4gICAgICAvLyBAdG9kbyBjaGVjayBwb3NzaWJpbGl0eSB0byBkaXNhYmxlIHRvcmNoIHdpdGhvdXQgcmVzdGFydFxyXG4gICAgICB0aGlzLnJlc3RhcnQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZSB0aGUgdG9yY2ggY29tcGF0aWJpbGl0eSBzdGF0ZSBhbmQgYXR0YWNocyB0aGUgc3RyZWFtIHRvIHRoZSBwcmV2aWV3IGVsZW1lbnQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhdHRhY2hTdHJlYW1Ub1ZpZGVvQW5kQ2hlY2tUb3JjaChzdHJlYW06IE1lZGlhU3RyZWFtLCB2aWRlb1NvdXJjZTogSFRNTFZpZGVvRWxlbWVudCk6IFByb21pc2U8SFRNTFZpZGVvRWxlbWVudD4ge1xyXG4gICAgdGhpcy51cGRhdGVUb3JjaENvbXBhdGliaWxpdHkoc3RyZWFtKTtcclxuICAgIHJldHVybiB0aGlzLmF0dGFjaFN0cmVhbVRvVmlkZW8oc3RyZWFtLCB2aWRlb1NvdXJjZSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGVja3MgaWYgdGhlIHN0cmVhbSBzdXBwb3J0cyB0b3JjaCBjb250cm9sLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHN0cmVhbSBUaGUgbWVkaWEgc3RyZWFtIHVzZWQgdG8gY2hlY2suXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGVUb3JjaENvbXBhdGliaWxpdHkoc3RyZWFtOiBNZWRpYVN0cmVhbSk6IFByb21pc2U8dm9pZD4ge1xyXG5cclxuICAgIGNvbnN0IHRyYWNrcyA9IHRoaXMuZ2V0VmlkZW9UcmFja3Moc3RyZWFtKTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IHRyYWNrIG9mIHRyYWNrcykge1xyXG4gICAgICBpZiAoYXdhaXQgdGhpcy5pc1RvcmNoQ29tcGF0aWJsZSh0cmFjaykpIHtcclxuICAgICAgICB0aGlzLl9pc1RvcmNoQXZhaWxhYmxlLm5leHQodHJ1ZSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHN0cmVhbSBUaGUgdmlkZW8gc3RyZWFtIHdoZXJlIHRoZSB0cmFja3MgZ29ubmEgYmUgZXh0cmFjdGVkIGZyb20uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRWaWRlb1RyYWNrcyhzdHJlYW06IE1lZGlhU3RyZWFtKSB7XHJcbiAgICBsZXQgdHJhY2tzID0gW107XHJcbiAgICB0cnkge1xyXG4gICAgICB0cmFja3MgPSBzdHJlYW0uZ2V0VmlkZW9UcmFja3MoKTtcclxuICAgIH1cclxuICAgIGZpbmFsbHkge1xyXG4gICAgICByZXR1cm4gdHJhY2tzIHx8IFtdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdHJhY2sgVGhlIG1lZGlhIHN0cmVhbSB0cmFjayB0aGF0IHdpbGwgYmUgY2hlY2tlZCBmb3IgY29tcGF0aWJpbGl0eS5cclxuICAgKi9cclxuICBwcml2YXRlIGFzeW5jIGlzVG9yY2hDb21wYXRpYmxlKHRyYWNrOiBNZWRpYVN0cmVhbVRyYWNrKSB7XHJcblxyXG4gICAgbGV0IGNvbXBhdGlibGUgPSBmYWxzZTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBpbWFnZUNhcHR1cmUgPSBuZXcgSW1hZ2VDYXB0dXJlKHRyYWNrKTtcclxuICAgICAgY29uc3QgY2FwYWJpbGl0aWVzID0gYXdhaXQgaW1hZ2VDYXB0dXJlLmdldFBob3RvQ2FwYWJpbGl0aWVzKCk7XHJcbiAgICAgIGNvbXBhdGlibGUgPSAhIWNhcGFiaWxpdGllc1sndG9yY2gnXSB8fCAoJ2ZpbGxMaWdodE1vZGUnIGluIGNhcGFiaWxpdGllcyAmJiBjYXBhYmlsaXRpZXMuZmlsbExpZ2h0TW9kZS5sZW5ndGggIT09IDApO1xyXG4gICAgfVxyXG4gICAgZmluYWxseSB7XHJcbiAgICAgIHJldHVybiBjb21wYXRpYmxlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXBwbHkgdGhlIHRvcmNoIHNldHRpbmcgaW4gYWxsIHJlY2VpdmVkIHRyYWNrcy5cclxuICAgKi9cclxuICBwcml2YXRlIGFwcGx5VG9yY2hPblRyYWNrcyh0cmFja3M6IE1lZGlhU3RyZWFtVHJhY2tbXSwgc3RhdGU6IGJvb2xlYW4pIHtcclxuICAgIHRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHRyYWNrLmFwcGx5Q29uc3RyYWludHMoe1xyXG4gICAgICBhZHZhbmNlZDogWzxhbnk+eyB0b3JjaDogc3RhdGUsIGZpbGxMaWdodE1vZGU6IHN0YXRlID8gJ3RvcmNoJyA6ICdub25lJyB9XVxyXG4gICAgfSkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29ycmVjdGx5IHNldHMgYSBuZXcgc2NhblN0cmVhbSB2YWx1ZS5cclxuICAgKi9cclxuICBwcml2YXRlIF9zZXRTY2FuU3RyZWFtKHNjYW4kOiBCZWhhdmlvclN1YmplY3Q8UmVzdWx0QW5kRXJyb3I+KTogdm9pZCB7XHJcbiAgICAvLyBjbGVhbnMgb2xkIHN0cmVhbVxyXG4gICAgdGhpcy5fY2xlYW5TY2FuU3RyZWFtKCk7XHJcbiAgICAvLyBzZXRzIG5ldyBzdHJlYW1cclxuICAgIHRoaXMuc2NhblN0cmVhbSA9IHNjYW4kO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xlYW5zIGFueSBvbGQgc2NhbiBzdHJlYW0gdmFsdWUuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfY2xlYW5TY2FuU3RyZWFtKCk6IHZvaWQge1xyXG5cclxuICAgIGlmICh0aGlzLnNjYW5TdHJlYW0gJiYgIXRoaXMuc2NhblN0cmVhbS5pc1N0b3BwZWQpIHtcclxuICAgICAgdGhpcy5zY2FuU3RyZWFtLmNvbXBsZXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zY2FuU3RyZWFtID0gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlY29kZXMgdmFsdWVzIGluIGEgc3RyZWFtIHdpdGggZGVsYXlzIGJldHdlZW4gc2NhbnMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gc2NhbiQgVGhlIHN1YmplY3QgdG8gcmVjZWl2ZSB0aGUgdmFsdWVzLlxyXG4gICAqIEBwYXJhbSB2aWRlb0VsZW1lbnQgVGhlIHZpZGVvIGVsZW1lbnQgdGhlIGRlY29kZSB3aWxsIGJlIGFwcGxpZWQuXHJcbiAgICogQHBhcmFtIGRlbGF5IFRoZSBkZWxheSBiZXR3ZWVuIGRlY29kZSByZXN1bHRzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZGVjb2RlT25TdWJqZWN0KHNjYW4kOiBCZWhhdmlvclN1YmplY3Q8UmVzdWx0QW5kRXJyb3I+LCB2aWRlb0VsZW1lbnQ6IEhUTUxWaWRlb0VsZW1lbnQsIGRlbGF5OiBudW1iZXIpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBzdG9wcyBsb29wXHJcbiAgICBpZiAoc2NhbiQuaXNTdG9wcGVkKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcmVzdWx0OiBSZXN1bHQ7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgcmVzdWx0ID0gdGhpcy5kZWNvZGUodmlkZW9FbGVtZW50KTtcclxuICAgICAgc2NhbiQubmV4dCh7IHJlc3VsdCB9KTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIC8vIHN0cmVhbSBjYW5ub3Qgc3RvcCBvbiBmYWlscy5cclxuICAgICAgaWYgKFxyXG4gICAgICAgICFlcnJvciB8fFxyXG4gICAgICAgIC8vIHNjYW4gRmFpbHVyZSAtIGZvdW5kIG5vdGhpbmcsIG5vIGVycm9yXHJcbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBOb3RGb3VuZEV4Y2VwdGlvbiB8fFxyXG4gICAgICAgIC8vIHNjYW4gRXJyb3IgLSBmb3VuZCB0aGUgUVIgYnV0IGdvdCBlcnJvciBvbiBkZWNvZGluZ1xyXG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgQ2hlY2tzdW1FeGNlcHRpb24gfHxcclxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEZvcm1hdEV4Y2VwdGlvblxyXG4gICAgICApIHtcclxuICAgICAgICBzY2FuJC5uZXh0KHsgZXJyb3IgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2NhbiQuZXJyb3IoZXJyb3IpO1xyXG4gICAgICB9XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICBjb25zdCB0aW1lb3V0ID0gIXJlc3VsdCA/IDAgOiBkZWxheTtcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmRlY29kZU9uU3ViamVjdChzY2FuJCwgdmlkZW9FbGVtZW50LCBkZWxheSksIHRpbWVvdXQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzdGFydHMgdGhlIHNjYW5uZXIuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSByZXN0YXJ0KCk6IE9ic2VydmFibGU8UmVzdWx0QW5kRXJyb3I+IHtcclxuICAgIC8vIHJlc2V0XHJcbiAgICAvLyBzdGFydFxyXG4gICAgcmV0dXJuIHRoaXMuY29udGludW91c0RlY29kZUZyb21JbnB1dFZpZGVvRGV2aWNlKHRoaXMuZGV2aWNlSWQsIHRoaXMudmlkZW9FbGVtZW50KTtcclxuICB9XHJcblxyXG59XHJcbiJdfQ==