import { CommonModule } from '@angular/common';
import { EventEmitter, Component, ChangeDetectionStrategy, ViewChild, Input, Output, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { __awaiter } from 'tslib';
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException, BarcodeFormat, ArgumentException, DecodeHintType } from '@zxing/library';
import { BehaviorSubject } from 'rxjs';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Based on zxing-typescript BrowserCodeReader
 */
class BrowserMultiFormatContinuousReader extends BrowserMultiFormatReader {
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
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
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

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
class ZXingScannerComponent {
    /**
     * Constructor to build the object and do some DI.
     */
    constructor() {
        /**
         * How the preview element shoud be fit inside the :host container.
         */
        this.previewFitMode = 'cover';
        // instance based emitters
        this.autostarted = new EventEmitter();
        this.autostarting = new EventEmitter();
        this.torchCompatible = new EventEmitter();
        this.scanSuccess = new EventEmitter();
        this.scanFailure = new EventEmitter();
        this.scanError = new EventEmitter();
        this.scanComplete = new EventEmitter();
        this.camerasFound = new EventEmitter();
        this.camerasNotFound = new EventEmitter();
        this.permissionResponse = new EventEmitter(true);
        this.hasDevices = new EventEmitter();
        this.deviceChange = new EventEmitter();
        this._device = null;
        this._enabled = true;
        this._hints = new Map();
        this.autofocusEnabled = true;
        this.autostart = true;
        this.formats = [BarcodeFormat.QR_CODE];
        // computed data
        this.hasNavigator = typeof navigator !== 'undefined';
        this.isMediaDevicesSuported = this.hasNavigator && !!navigator.mediaDevices;
    }
    /**
     * Exposes the current code reader, so the user can use it's APIs.
     * @return {?}
     */
    get codeReader() {
        return this._codeReader;
    }
    /**
     * User device input
     * @param {?} device
     * @return {?}
     */
    set device(device) {
        if (!device && device !== null) {
            throw new ArgumentException('The `device` must be a valid MediaDeviceInfo or null.');
        }
        if (this.isCurrentDevice(device)) {
            console.warn('Setting the same device is not allowed.');
            return;
        }
        if (this.isAutostarting) {
            // do not allow setting devices during auto-start, since it will set one and emit it.
            console.warn('Avoid setting a device during auto-start.');
            return;
        }
        if (!this.hasPermission) {
            console.warn('Permissions not set yet, waiting for them to be set to apply device change.');
            // this.permissionResponse
            //   .pipe(
            //     take(1),
            //     tap(() => console.log(`Permissions set, applying device change${device ? ` (${device.deviceId})` : ''}.`))
            //   )
            //   .subscribe(() => this.device = device);
            // return;
        }
        // in order to change the device the codeReader gotta be reseted
        this._reset();
        this._device = device;
        // if enabled, starts scanning
        if (this._enabled && device !== null) {
            this.scanFromDevice(device.deviceId);
        }
    }
    /**
     * User device acessor.
     * @return {?}
     */
    get device() {
        return this._device;
    }
    /**
     * Returns all the registered formats.
     * @return {?}
     */
    get formats() {
        return this.hints.get(DecodeHintType.POSSIBLE_FORMATS);
    }
    /**
     * Registers formats the scanner should support.
     *
     * @param {?} input BarcodeFormat or case-insensitive string array.
     * @return {?}
     */
    set formats(input) {
        if (typeof input === 'string') {
            throw new Error('Invalid formats, make sure the [formats] input is a binding.');
        }
        // formats may be set from html template as BarcodeFormat or string array
        /** @type {?} */
        const formats = input.map((/**
         * @param {?} f
         * @return {?}
         */
            f => this.getBarcodeFormatOrFail(f)));
        /** @type {?} */
        const hints = this.hints;
        // updates the hints
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        this.hints = hints;
    }
    /**
     * Returns all the registered hints.
     * @return {?}
     */
    get hints() {
        return this._hints;
    }
    /**
     * Does what it takes to set the hints.
     * @param {?} hints
     * @return {?}
     */
    set hints(hints) {
        this._hints = hints;
        // @note avoid restarting the code reader when possible
        // new instance with new hints.
        this.restart();
    }
    /**
     *
     * @param {?} state
     * @return {?}
     */
    set isAutostarting(state) {
        this._isAutostarting = state;
        this.autostarting.next(state);
    }
    /**
     *
     * @return {?}
     */
    get isAutstarting() {
        return this._isAutostarting;
    }
    /**
     * Allow start scan or not.
     * @param {?} on
     * @return {?}
     */
    set torch(on) {
        this.getCodeReader().setTorch(on);
    }
    /**
     * Allow start scan or not.
     * @param {?} enabled
     * @return {?}
     */
    set enable(enabled) {
        this._enabled = Boolean(enabled);
        if (!this._enabled) {
            this.reset();
        }
        else if (this.device) {
            this.scanFromDevice(this.device.deviceId);
        }
    }
    /**
     * Tells if the scanner is enabled or not.
     * @return {?}
     */
    get enabled() {
        return this._enabled;
    }
    /**
     * If is `tryHarder` enabled.
     * @return {?}
     */
    get tryHarder() {
        return this.hints.get(DecodeHintType.TRY_HARDER);
    }
    /**
     * Enable/disable tryHarder hint.
     * @param {?} enable
     * @return {?}
     */
    set tryHarder(enable) {
        /** @type {?} */
        const hints = this.hints;
        if (enable) {
            hints.set(DecodeHintType.TRY_HARDER, true);
        }
        else {
            hints.delete(DecodeHintType.TRY_HARDER);
        }
        this.hints = hints;
    }
    /**
     * Gets and registers all cammeras.
     * @return {?}
     */
    askForPermission() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasNavigator) {
                console.error('@zxing/ngx-scanner', 'Can\'t ask permission, navigator is not present.');
                this.setPermission(null);
                return this.hasPermission;
            }
            if (!this.isMediaDevicesSuported) {
                console.error('@zxing/ngx-scanner', 'Can\'t get user media, this is not supported.');
                this.setPermission(null);
                return this.hasPermission;
            }
            /** @type {?} */
            let stream;
            /** @type {?} */
            let permission;
            try {
                // Will try to ask for permission
                stream = yield this.getAnyVideoDevice();
                permission = !!stream;
            }
            catch (err) {
                return this.handlePermissionException(err);
            }
            finally {
                this.terminateStream(stream);
            }
            this.setPermission(permission);
            // Returns the permission
            return permission;
        });
    }
    /**
     *
     * @return {?}
     */
    getAnyVideoDevice() {
        return navigator.mediaDevices.getUserMedia({ video: true });
    }
    /**
     * Terminates a stream and it's tracks.
     * @private
     * @param {?} stream
     * @return {?}
     */
    terminateStream(stream) {
        if (stream) {
            stream.getTracks().forEach((/**
             * @param {?} t
             * @return {?}
             */
                t => t.stop()));
        }
        stream = undefined;
    }
    /**
     * Initializes the component without starting the scanner.
     * @private
     * @return {?}
     */
    initAutostartOff() {
        // do not ask for permission when autostart is off
        this.isAutostarting = null;
        // just update devices information
        this.updateVideoInputDevices();
    }
    /**
     * Initializes the component and starts the scanner.
     * Permissions are asked to accomplish that.
     * @private
     * @return {?}
     */
    initAutostartOn() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isAutostarting = true;
            /** @type {?} */
            let hasPermission;
            try {
                // Asks for permission before enumerating devices so it can get all the device's info
                hasPermission = yield this.askForPermission();
            }
            catch (e) {
                console.error('Exception occurred while asking for permission:', e);
                return;
            }
            // from this point, things gonna need permissions
            if (hasPermission) {
                /** @type {?} */
                const devices = yield this.updateVideoInputDevices();
                this.autostartScanner([...devices]);
            }
        });
    }
    /**
     * Checks if the given device is the current defined one.
     * @param {?} device
     * @return {?}
     */
    isCurrentDevice(device) {
        return this.device && device && device.deviceId === this.device.deviceId;
    }
    /**
     * Executed after the view initialization.
     * @return {?}
     */
    ngAfterViewInit() {
        // makes torch availability information available to user
        this.getCodeReader().isTorchAvailable.subscribe((/**
         * @param {?} x
         * @return {?}
         */
            x => this.torchCompatible.emit(x)));
        if (!this.autostart) {
            console.warn('New feature \'autostart\' disabled, be careful. Permissions and devices recovery has to be run manually.');
            // does the necessary configuration without autostarting
            this.initAutostartOff();
            return;
        }
        // configurates the component and starts the scanner
        this.initAutostartOn();
    }
    /**
     * Executes some actions before destroy the component.
     * @return {?}
     */
    ngOnDestroy() {
        this.reset();
    }
    /**
     * Stops old `codeReader` and starts scanning in a new one.
     * @return {?}
     */
    restart() {
        /** @type {?} */
        const prevDevice = this._reset();
        if (!prevDevice) {
            return;
        }
        // @note apenas necessario por enquanto causa da Torch
        this._codeReader = undefined;
        this.device = prevDevice;
    }
    /**
     * Discovers and updates known video input devices.
     * @return {?}
     */
    updateVideoInputDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            // permissions aren't needed to get devices, but to access them and their info
            /** @type {?} */
            const devices = (yield this.getCodeReader().listVideoInputDevices()) || [];
            /** @type {?} */
            const hasDevices = devices && devices.length > 0;
            // stores discovered devices and updates information
            this.hasDevices.next(hasDevices);
            this.camerasFound.next([...devices]);
            if (!hasDevices) {
                this.camerasNotFound.next();
            }
            return devices;
        });
    }
    /**
     * Starts the scanner with the back camera otherwise take the last
     * available device.
     * @private
     * @param {?} devices
     * @return {?}
     */
    autostartScanner(devices) {
        /** @type {?} */
        const matcher = (/**
         * @param {?} __0
         * @return {?}
         */
            ({ label }) => /back|trás|rear|traseira|environment|ambiente/gi.test(label));
        // select the rear camera by default, otherwise take the last camera.
        /** @type {?} */
        const device = devices.find(matcher) || devices.pop();
        if (!device) {
            throw new Error('Impossible to autostart, no input devices available.');
        }
        this.device = device;
        // @note when listening to this change, callback code will sometimes run before the previous line.
        this.deviceChange.emit(device);
        this.isAutostarting = false;
        this.autostarted.next();
    }
    /**
     * Dispatches the scan success event.
     *
     * @private
     * @param {?} result the scan result.
     * @return {?}
     */
    dispatchScanSuccess(result) {
        this.scanSuccess.next(result.getText());
    }
    /**
     * Dispatches the scan failure event.
     * @private
     * @param {?=} reason
     * @return {?}
     */
    dispatchScanFailure(reason) {
        this.scanFailure.next(reason);
    }
    /**
     * Dispatches the scan error event.
     *
     * @private
     * @param {?} error the error thing.
     * @return {?}
     */
    dispatchScanError(error) {
        this.scanError.next(error);
    }
    /**
     * Dispatches the scan event.
     *
     * @private
     * @param {?} result the scan result.
     * @return {?}
     */
    dispatchScanComplete(result) {
        this.scanComplete.next(result);
    }
    /**
     * Returns the filtered permission.
     * @private
     * @param {?} err
     * @return {?}
     */
    handlePermissionException(err) {
        // failed to grant permission to video input
        console.error('@zxing/ngx-scanner', 'Error when asking for permission.', err);
        /** @type {?} */
        let permission;
        switch (err.name) {
            // usually caused by not secure origins
            case 'NotSupportedError':
                console.warn('@zxing/ngx-scanner', err.message);
                // could not claim
                permission = null;
                // can't check devices
                this.hasDevices.next(null);
                break;
            // user denied permission
            case 'NotAllowedError':
                console.warn('@zxing/ngx-scanner', err.message);
                // claimed and denied permission
                permission = false;
                // this means that input devices exists
                this.hasDevices.next(true);
                break;
            // the device has no attached input devices
            case 'NotFoundError':
                console.warn('@zxing/ngx-scanner', err.message);
                // no permissions claimed
                permission = null;
                // because there was no devices
                this.hasDevices.next(false);
                // tells the listener about the error
                this.camerasNotFound.next(err);
                break;
            case 'NotReadableError':
                console.warn('@zxing/ngx-scanner', 'Couldn\'t read the device(s)\'s stream, it\'s probably in use by another app.');
                // no permissions claimed
                permission = null;
                // there are devices, which I couldn't use
                this.hasDevices.next(false);
                // tells the listener about the error
                this.camerasNotFound.next(err);
                break;
            default:
                console.warn('@zxing/ngx-scanner', 'I was not able to define if I have permissions for camera or not.', err);
                // unknown
                permission = null;
                // this.hasDevices.next(undefined;
                break;
        }
        this.setPermission(permission);
        // tells the listener about the error
        this.permissionResponse.error(err);
        return permission;
    }
    /**
     * Returns a valid BarcodeFormat or fails.
     * @private
     * @param {?} format
     * @return {?}
     */
    getBarcodeFormatOrFail(format) {
        return typeof format === 'string'
            ? BarcodeFormat[format.trim().toUpperCase()]
            : format;
    }
    /**
     * Retorna um code reader, cria um se nenhume existe.
     * @private
     * @return {?}
     */
    getCodeReader() {
        if (!this._codeReader) {
            this._codeReader = new BrowserMultiFormatContinuousReader(this.hints);
        }
        return this._codeReader;
    }
    /**
     * Starts the continuous scanning for the given device.
     *
     * @private
     * @param {?} deviceId The deviceId from the device.
     * @return {?}
     */
    scanFromDevice(deviceId) {
        /** @type {?} */
        const videoElement = this.previewElemRef.nativeElement;
        /** @type {?} */
        const codeReader = this.getCodeReader();
        /** @type {?} */
        const decodingStream = codeReader.continuousDecodeFromInputVideoDevice(deviceId, videoElement);
        if (!decodingStream) {
            throw new Error('Undefined decoding stream, aborting.');
        }
        /** @type {?} */
        const next = (/**
         * @param {?} x
         * @return {?}
         */
            (x) => this._onDecodeResult(x.result, x.error));
        /** @type {?} */
        const error = (/**
         * @param {?} err
         * @return {?}
         */
            (err) => this._onDecodeError(err));
        /** @type {?} */
        const complete = (/**
         * @return {?}
         */
            () => { this.reset(); console.log('completed'); });
        decodingStream.subscribe(next, error, complete);
    }
    /**
     * Handles decode errors.
     * @private
     * @param {?} err
     * @return {?}
     */
    _onDecodeError(err) {
        this.dispatchScanError(err);
        this.reset();
    }
    /**
     * Handles decode results.
     * @private
     * @param {?} result
     * @param {?} error
     * @return {?}
     */
    _onDecodeResult(result, error) {
        if (result) {
            this.dispatchScanSuccess(result);
        }
        else {
            this.dispatchScanFailure(error);
        }
        this.dispatchScanComplete(result);
    }
    /**
     * Stops the code reader and returns the previous selected device.
     * @private
     * @return {?}
     */
    _reset() {
        if (!this._codeReader) {
            return;
        }
        /** @type {?} */
        const device = this.device;
        // do not set this.device inside this method, it would create a recursive loop
        this._device = null;
        this._codeReader.reset();
        return device;
    }
    /**
     * Resets the scanner and emits device change.
     * @return {?}
     */
    reset() {
        this._reset();
        this.deviceChange.emit(null);
    }
    /**
     * Sets the permission value and emmits the event.
     * @private
     * @param {?} hasPermission
     * @return {?}
     */
    setPermission(hasPermission) {
        this.hasPermission = hasPermission;
        this.permissionResponse.next(hasPermission);
    }
}
ZXingScannerComponent.decorators = [
    {
        type: Component, args: [{
            selector: 'zxing-scanner',
            template: "<video #preview [style.object-fit]=\"previewFitMode\">\r\n  <p>\r\n    Your browser does not support this feature, please try to upgrade it.\r\n  </p>\r\n  <p>\r\n    Seu navegador n\u00E3o suporta este recurso, por favor tente atualiz\u00E1-lo.\r\n  </p>\r\n</video>\r\n",
            changeDetection: ChangeDetectionStrategy.OnPush,
            styles: [":host{display:block}video{width:100%;height:auto;-o-object-fit:contain;object-fit:contain}"]
        }]
    }
];
/** @nocollapse */
ZXingScannerComponent.ctorParameters = () => [];
ZXingScannerComponent.propDecorators = {
    previewElemRef: [{ type: ViewChild, args: ['preview', { static: true },] }],
    autofocusEnabled: [{ type: Input }],
    autostarted: [{ type: Output }],
    autostarting: [{ type: Output }],
    autostart: [{ type: Input }],
    previewFitMode: [{ type: Input }],
    torchCompatible: [{ type: Output }],
    scanSuccess: [{ type: Output }],
    scanFailure: [{ type: Output }],
    scanError: [{ type: Output }],
    scanComplete: [{ type: Output }],
    camerasFound: [{ type: Output }],
    camerasNotFound: [{ type: Output }],
    permissionResponse: [{ type: Output }],
    hasDevices: [{ type: Output }],
    device: [{ type: Input }],
    deviceChange: [{ type: Output }],
    formats: [{ type: Input }],
    torch: [{ type: Input }],
    enable: [{ type: Input }],
    tryHarder: [{ type: Input }]
};

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
class ZXingScannerModule {
}
ZXingScannerModule.decorators = [
    {
        type: NgModule, args: [{
            imports: [
                CommonModule,
                FormsModule
            ],
            declarations: [ZXingScannerComponent],
            exports: [ZXingScannerComponent],
        },]
    }
];

export { ZXingScannerComponent, ZXingScannerModule };
//# sourceMappingURL=zxing-ngx-scanner.js.map
