/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import * as tslib_1 from "tslib";
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ArgumentException, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BrowserMultiFormatContinuousReader } from './browser-multi-format-continuous-reader';
export class ZXingScannerComponent {
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
    { type: Component, args: [{
                selector: 'zxing-scanner',
                template: "<video #preview [style.object-fit]=\"previewFitMode\">\r\n  <p>\r\n    Your browser does not support this feature, please try to upgrade it.\r\n  </p>\r\n  <p>\r\n    Seu navegador n\u00E3o suporta este recurso, por favor tente atualiz\u00E1-lo.\r\n  </p>\r\n</video>\r\n",
                changeDetection: ChangeDetectionStrategy.OnPush,
                styles: [":host{display:block}video{width:100%;height:auto;-o-object-fit:contain;object-fit:contain}"]
            }] }
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
if (false) {
    /**
     * Supported Hints map.
     * @type {?}
     * @private
     */
    ZXingScannerComponent.prototype._hints;
    /**
     * The ZXing code reader.
     * @type {?}
     * @private
     */
    ZXingScannerComponent.prototype._codeReader;
    /**
     * The device that should be used to scan things.
     * @type {?}
     * @private
     */
    ZXingScannerComponent.prototype._device;
    /**
     * The device that should be used to scan things.
     * @type {?}
     * @private
     */
    ZXingScannerComponent.prototype._enabled;
    /**
     *
     * @type {?}
     * @private
     */
    ZXingScannerComponent.prototype._isAutostarting;
    /**
     * Has `navigator` access.
     * @type {?}
     * @private
     */
    ZXingScannerComponent.prototype.hasNavigator;
    /**
     * Says if some native API is supported.
     * @type {?}
     * @private
     */
    ZXingScannerComponent.prototype.isMediaDevicesSuported;
    /**
     * If the user-agent allowed the use of the camera or not.
     * @type {?}
     * @private
     */
    ZXingScannerComponent.prototype.hasPermission;
    /**
     * Reference to the preview element, should be the `video` tag.
     * @type {?}
     */
    ZXingScannerComponent.prototype.previewElemRef;
    /**
     * Enable or disable autofocus of the camera (might have an impact on performance)
     * @type {?}
     */
    ZXingScannerComponent.prototype.autofocusEnabled;
    /**
     * Emits when and if the scanner is autostarted.
     * @type {?}
     */
    ZXingScannerComponent.prototype.autostarted;
    /**
     * True during autostart and false after. It will be null if won't autostart at all.
     * @type {?}
     */
    ZXingScannerComponent.prototype.autostarting;
    /**
     * If the scanner should autostart with the first available device.
     * @type {?}
     */
    ZXingScannerComponent.prototype.autostart;
    /**
     * How the preview element shoud be fit inside the :host container.
     * @type {?}
     */
    ZXingScannerComponent.prototype.previewFitMode;
    /**
     * Emitts events when the torch compatibility is changed.
     * @type {?}
     */
    ZXingScannerComponent.prototype.torchCompatible;
    /**
     * Emitts events when a scan is successful performed, will inject the string value of the QR-code to the callback.
     * @type {?}
     */
    ZXingScannerComponent.prototype.scanSuccess;
    /**
     * Emitts events when a scan fails without errors, usefull to know how much scan tries where made.
     * @type {?}
     */
    ZXingScannerComponent.prototype.scanFailure;
    /**
     * Emitts events when a scan throws some error, will inject the error to the callback.
     * @type {?}
     */
    ZXingScannerComponent.prototype.scanError;
    /**
     * Emitts events when a scan is performed, will inject the Result value of the QR-code scan (if available) to the callback.
     * @type {?}
     */
    ZXingScannerComponent.prototype.scanComplete;
    /**
     * Emitts events when no cameras are found, will inject an exception (if available) to the callback.
     * @type {?}
     */
    ZXingScannerComponent.prototype.camerasFound;
    /**
     * Emitts events when no cameras are found, will inject an exception (if available) to the callback.
     * @type {?}
     */
    ZXingScannerComponent.prototype.camerasNotFound;
    /**
     * Emitts events when the users answers for permission.
     * @type {?}
     */
    ZXingScannerComponent.prototype.permissionResponse;
    /**
     * Emitts events when has devices status is update.
     * @type {?}
     */
    ZXingScannerComponent.prototype.hasDevices;
    /**
     * Emits when the current device is changed.
     * @type {?}
     */
    ZXingScannerComponent.prototype.deviceChange;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoienhpbmctc2Nhbm5lci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Aenhpbmcvbmd4LXNjYW5uZXIvIiwic291cmNlcyI6WyJsaWIvenhpbmctc2Nhbm5lci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxPQUFPLEVBRUwsdUJBQXVCLEVBQ3ZCLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLEtBQUssRUFFTCxNQUFNLEVBQ04sU0FBUyxFQUVWLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFDTCxpQkFBaUIsRUFDakIsYUFBYSxFQUNiLGNBQWMsRUFHZixNQUFNLGdCQUFnQixDQUFDO0FBRXhCLE9BQU8sRUFBRSxrQ0FBa0MsRUFBRSxNQUFNLDBDQUEwQyxDQUFDO0FBUzlGLE1BQU0sT0FBTyxxQkFBcUI7Ozs7SUE2VGhDOzs7O1FBalBBLG1CQUFjLEdBQXlELE9BQU8sQ0FBQztRQWtQN0UsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDdEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUN2QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJ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QTZCTCxLQUFLOzs7Ozs7OztJQXZTTix1Q0FBZ0Q7Ozs7OztJQUtoRCw0Q0FBd0Q7Ozs7OztJQUt4RCx3Q0FBaUM7Ozs7OztJQUtqQyx5Q0FBMEI7Ozs7OztJQUsxQixnREFBaUM7Ozs7OztJQUtqQyw2Q0FBOEI7Ozs7OztJQUs5Qix1REFBd0M7Ozs7OztJQUt4Qyw4Q0FBc0M7Ozs7O0lBS3RDLCtDQUM2Qzs7Ozs7SUFLN0MsaURBQzBCOzs7OztJQUsxQiw0Q0FDZ0M7Ozs7O0lBS2hDLDZDQUMyQzs7Ozs7SUFLM0MsMENBQ21COzs7OztJQUtuQiwrQ0FDK0U7Ozs7O0lBSy9FLGdEQUN1Qzs7Ozs7SUFLdkMsNENBQ2tDOzs7OztJQUtsQyw0Q0FDaUQ7Ozs7O0lBS2pELDBDQUMrQjs7Ozs7SUFLL0IsNkNBQ21DOzs7OztJQUtuQyw2Q0FDOEM7Ozs7O0lBSzlDLGdEQUNtQzs7Ozs7SUFLbkMsbURBQzBDOzs7OztJQUsxQywyQ0FDa0M7Ozs7O0lBdURsQyw2Q0FDNEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xyXG4gIEFmdGVyVmlld0luaXQsXHJcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXHJcbiAgQ29tcG9uZW50LFxyXG4gIEVsZW1lbnRSZWYsXHJcbiAgRXZlbnRFbWl0dGVyLFxyXG4gIElucHV0LFxyXG4gIE9uRGVzdHJveSxcclxuICBPdXRwdXQsXHJcbiAgVmlld0NoaWxkLFxyXG4gIE5nWm9uZVxyXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5cclxuaW1wb3J0IHtcclxuICBBcmd1bWVudEV4Y2VwdGlvbixcclxuICBCYXJjb2RlRm9ybWF0LFxyXG4gIERlY29kZUhpbnRUeXBlLFxyXG4gIEV4Y2VwdGlvbixcclxuICBSZXN1bHRcclxufSBmcm9tICdAenhpbmcvbGlicmFyeSc7XHJcblxyXG5pbXBvcnQgeyBCcm93c2VyTXVsdGlGb3JtYXRDb250aW51b3VzUmVhZGVyIH0gZnJvbSAnLi9icm93c2VyLW11bHRpLWZvcm1hdC1jb250aW51b3VzLXJlYWRlcic7XHJcbmltcG9ydCB7IFJlc3VsdEFuZEVycm9yIH0gZnJvbSAnLi9SZXN1bHRBbmRFcnJvcic7XHJcblxyXG5AQ29tcG9uZW50KHtcclxuICBzZWxlY3RvcjogJ3p4aW5nLXNjYW5uZXInLFxyXG4gIHRlbXBsYXRlVXJsOiAnLi96eGluZy1zY2FubmVyLmNvbXBvbmVudC5odG1sJyxcclxuICBzdHlsZVVybHM6IFsnLi96eGluZy1zY2FubmVyLmNvbXBvbmVudC5zY3NzJ10sXHJcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hcclxufSlcclxuZXhwb3J0IGNsYXNzIFpYaW5nU2Nhbm5lckNvbXBvbmVudCBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uRGVzdHJveSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1cHBvcnRlZCBIaW50cyBtYXAuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfaGludHM6IE1hcDxEZWNvZGVIaW50VHlwZSwgYW55PiB8IG51bGw7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBaWGluZyBjb2RlIHJlYWRlci5cclxuICAgKi9cclxuICBwcml2YXRlIF9jb2RlUmVhZGVyOiBCcm93c2VyTXVsdGlGb3JtYXRDb250aW51b3VzUmVhZGVyO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgZGV2aWNlIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gc2NhbiB0aGluZ3MuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfZGV2aWNlOiBNZWRpYURldmljZUluZm87XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBkZXZpY2UgdGhhdCBzaG91bGQgYmUgdXNlZCB0byBzY2FuIHRoaW5ncy5cclxuICAgKi9cclxuICBwcml2YXRlIF9lbmFibGVkOiBib29sZWFuO1xyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2lzQXV0b3N0YXJ0aW5nOiBib29sZWFuO1xyXG5cclxuICAvKipcclxuICAgKiBIYXMgYG5hdmlnYXRvcmAgYWNjZXNzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFzTmF2aWdhdG9yOiBib29sZWFuO1xyXG5cclxuICAvKipcclxuICAgKiBTYXlzIGlmIHNvbWUgbmF0aXZlIEFQSSBpcyBzdXBwb3J0ZWQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBpc01lZGlhRGV2aWNlc1N1cG9ydGVkOiBib29sZWFuO1xyXG5cclxuICAvKipcclxuICAgKiBJZiB0aGUgdXNlci1hZ2VudCBhbGxvd2VkIHRoZSB1c2Ugb2YgdGhlIGNhbWVyYSBvciBub3QuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYXNQZXJtaXNzaW9uOiBib29sZWFuIHwgbnVsbDtcclxuXHJcbiAgLyoqXHJcbiAgICogUmVmZXJlbmNlIHRvIHRoZSBwcmV2aWV3IGVsZW1lbnQsIHNob3VsZCBiZSB0aGUgYHZpZGVvYCB0YWcuXHJcbiAgICovXHJcbiAgQFZpZXdDaGlsZCgncHJldmlldycsIHsgc3RhdGljOiB0cnVlIH0pXHJcbiAgcHJldmlld0VsZW1SZWY6IEVsZW1lbnRSZWY8SFRNTFZpZGVvRWxlbWVudD47XHJcblxyXG4gIC8qKlxyXG4gICAqIEVuYWJsZSBvciBkaXNhYmxlIGF1dG9mb2N1cyBvZiB0aGUgY2FtZXJhIChtaWdodCBoYXZlIGFuIGltcGFjdCBvbiBwZXJmb3JtYW5jZSlcclxuICAgKi9cclxuICBASW5wdXQoKVxyXG4gIGF1dG9mb2N1c0VuYWJsZWQ6IGJvb2xlYW47XHJcblxyXG4gIC8qKlxyXG4gICAqIEVtaXRzIHdoZW4gYW5kIGlmIHRoZSBzY2FubmVyIGlzIGF1dG9zdGFydGVkLlxyXG4gICAqL1xyXG4gIEBPdXRwdXQoKVxyXG4gIGF1dG9zdGFydGVkOiBFdmVudEVtaXR0ZXI8dm9pZD47XHJcblxyXG4gIC8qKlxyXG4gICAqIFRydWUgZHVyaW5nIGF1dG9zdGFydCBhbmQgZmFsc2UgYWZ0ZXIuIEl0IHdpbGwgYmUgbnVsbCBpZiB3b24ndCBhdXRvc3RhcnQgYXQgYWxsLlxyXG4gICAqL1xyXG4gIEBPdXRwdXQoKVxyXG4gIGF1dG9zdGFydGluZzogRXZlbnRFbWl0dGVyPGJvb2xlYW4gfCBudWxsPjtcclxuXHJcbiAgLyoqXHJcbiAgICogSWYgdGhlIHNjYW5uZXIgc2hvdWxkIGF1dG9zdGFydCB3aXRoIHRoZSBmaXJzdCBhdmFpbGFibGUgZGV2aWNlLlxyXG4gICAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgYXV0b3N0YXJ0OiBib29sZWFuO1xyXG5cclxuICAvKipcclxuICAgKiBIb3cgdGhlIHByZXZpZXcgZWxlbWVudCBzaG91ZCBiZSBmaXQgaW5zaWRlIHRoZSA6aG9zdCBjb250YWluZXIuXHJcbiAgICovXHJcbiAgQElucHV0KClcclxuICBwcmV2aWV3Rml0TW9kZTogJ2ZpbGwnIHwgJ2NvbnRhaW4nIHwgJ2NvdmVyJyB8ICdzY2FsZS1kb3duJyB8ICdub25lJyA9ICdjb3Zlcic7XHJcblxyXG4gIC8qKlxyXG4gICAqIEVtaXR0cyBldmVudHMgd2hlbiB0aGUgdG9yY2ggY29tcGF0aWJpbGl0eSBpcyBjaGFuZ2VkLlxyXG4gICAqL1xyXG4gIEBPdXRwdXQoKVxyXG4gIHRvcmNoQ29tcGF0aWJsZTogRXZlbnRFbWl0dGVyPGJvb2xlYW4+O1xyXG5cclxuICAvKipcclxuICAgKiBFbWl0dHMgZXZlbnRzIHdoZW4gYSBzY2FuIGlzIHN1Y2Nlc3NmdWwgcGVyZm9ybWVkLCB3aWxsIGluamVjdCB0aGUgc3RyaW5nIHZhbHVlIG9mIHRoZSBRUi1jb2RlIHRvIHRoZSBjYWxsYmFjay5cclxuICAgKi9cclxuICBAT3V0cHV0KClcclxuICBzY2FuU3VjY2VzczogRXZlbnRFbWl0dGVyPHN0cmluZz47XHJcblxyXG4gIC8qKlxyXG4gICAqIEVtaXR0cyBldmVudHMgd2hlbiBhIHNjYW4gZmFpbHMgd2l0aG91dCBlcnJvcnMsIHVzZWZ1bGwgdG8ga25vdyBob3cgbXVjaCBzY2FuIHRyaWVzIHdoZXJlIG1hZGUuXHJcbiAgICovXHJcbiAgQE91dHB1dCgpXHJcbiAgc2NhbkZhaWx1cmU6IEV2ZW50RW1pdHRlcjxFeGNlcHRpb24gfCB1bmRlZmluZWQ+O1xyXG5cclxuICAvKipcclxuICAgKiBFbWl0dHMgZXZlbnRzIHdoZW4gYSBzY2FuIHRocm93cyBzb21lIGVycm9yLCB3aWxsIGluamVjdCB0aGUgZXJyb3IgdG8gdGhlIGNhbGxiYWNrLlxyXG4gICAqL1xyXG4gIEBPdXRwdXQoKVxyXG4gIHNjYW5FcnJvcjogRXZlbnRFbWl0dGVyPEVycm9yPjtcclxuXHJcbiAgLyoqXHJcbiAgICogRW1pdHRzIGV2ZW50cyB3aGVuIGEgc2NhbiBpcyBwZXJmb3JtZWQsIHdpbGwgaW5qZWN0IHRoZSBSZXN1bHQgdmFsdWUgb2YgdGhlIFFSLWNvZGUgc2NhbiAoaWYgYXZhaWxhYmxlKSB0byB0aGUgY2FsbGJhY2suXHJcbiAgICovXHJcbiAgQE91dHB1dCgpXHJcbiAgc2NhbkNvbXBsZXRlOiBFdmVudEVtaXR0ZXI8UmVzdWx0PjtcclxuXHJcbiAgLyoqXHJcbiAgICogRW1pdHRzIGV2ZW50cyB3aGVuIG5vIGNhbWVyYXMgYXJlIGZvdW5kLCB3aWxsIGluamVjdCBhbiBleGNlcHRpb24gKGlmIGF2YWlsYWJsZSkgdG8gdGhlIGNhbGxiYWNrLlxyXG4gICAqL1xyXG4gIEBPdXRwdXQoKVxyXG4gIGNhbWVyYXNGb3VuZDogRXZlbnRFbWl0dGVyPE1lZGlhRGV2aWNlSW5mb1tdPjtcclxuXHJcbiAgLyoqXHJcbiAgICogRW1pdHRzIGV2ZW50cyB3aGVuIG5vIGNhbWVyYXMgYXJlIGZvdW5kLCB3aWxsIGluamVjdCBhbiBleGNlcHRpb24gKGlmIGF2YWlsYWJsZSkgdG8gdGhlIGNhbGxiYWNrLlxyXG4gICAqL1xyXG4gIEBPdXRwdXQoKVxyXG4gIGNhbWVyYXNOb3RGb3VuZDogRXZlbnRFbWl0dGVyPGFueT47XHJcblxyXG4gIC8qKlxyXG4gICAqIEVtaXR0cyBldmVudHMgd2hlbiB0aGUgdXNlcnMgYW5zd2VycyBmb3IgcGVybWlzc2lvbi5cclxuICAgKi9cclxuICBAT3V0cHV0KClcclxuICBwZXJtaXNzaW9uUmVzcG9uc2U6IEV2ZW50RW1pdHRlcjxib29sZWFuPjtcclxuXHJcbiAgLyoqXHJcbiAgICogRW1pdHRzIGV2ZW50cyB3aGVuIGhhcyBkZXZpY2VzIHN0YXR1cyBpcyB1cGRhdGUuXHJcbiAgICovXHJcbiAgQE91dHB1dCgpXHJcbiAgaGFzRGV2aWNlczogRXZlbnRFbWl0dGVyPGJvb2xlYW4+O1xyXG5cclxuICAvKipcclxuICAgKiBFeHBvc2VzIHRoZSBjdXJyZW50IGNvZGUgcmVhZGVyLCBzbyB0aGUgdXNlciBjYW4gdXNlIGl0J3MgQVBJcy5cclxuICAgKi9cclxuICBnZXQgY29kZVJlYWRlcigpOiBCcm93c2VyTXVsdGlGb3JtYXRDb250aW51b3VzUmVhZGVyIHtcclxuICAgIHJldHVybiB0aGlzLl9jb2RlUmVhZGVyO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNlciBkZXZpY2UgaW5wdXRcclxuICAgKi9cclxuICBASW5wdXQoKVxyXG4gIHNldCBkZXZpY2UoZGV2aWNlOiBNZWRpYURldmljZUluZm8gfCBudWxsKSB7XHJcblxyXG4gICAgaWYgKCFkZXZpY2UgJiYgZGV2aWNlICE9PSBudWxsKSB7XHJcbiAgICAgIHRocm93IG5ldyBBcmd1bWVudEV4Y2VwdGlvbignVGhlIGBkZXZpY2VgIG11c3QgYmUgYSB2YWxpZCBNZWRpYURldmljZUluZm8gb3IgbnVsbC4nKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5pc0N1cnJlbnREZXZpY2UoZGV2aWNlKSkge1xyXG4gICAgICBjb25zb2xlLndhcm4oJ1NldHRpbmcgdGhlIHNhbWUgZGV2aWNlIGlzIG5vdCBhbGxvd2VkLicpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuaXNBdXRvc3RhcnRpbmcpIHtcclxuICAgICAgLy8gZG8gbm90IGFsbG93IHNldHRpbmcgZGV2aWNlcyBkdXJpbmcgYXV0by1zdGFydCwgc2luY2UgaXQgd2lsbCBzZXQgb25lIGFuZCBlbWl0IGl0LlxyXG4gICAgICBjb25zb2xlLndhcm4oJ0F2b2lkIHNldHRpbmcgYSBkZXZpY2UgZHVyaW5nIGF1dG8tc3RhcnQuJyk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuaGFzUGVybWlzc2lvbikge1xyXG4gICAgICBjb25zb2xlLndhcm4oJ1Blcm1pc3Npb25zIG5vdCBzZXQgeWV0LCB3YWl0aW5nIGZvciB0aGVtIHRvIGJlIHNldCB0byBhcHBseSBkZXZpY2UgY2hhbmdlLicpO1xyXG4gICAgICAvLyB0aGlzLnBlcm1pc3Npb25SZXNwb25zZVxyXG4gICAgICAvLyAgIC5waXBlKFxyXG4gICAgICAvLyAgICAgdGFrZSgxKSxcclxuICAgICAgLy8gICAgIHRhcCgoKSA9PiBjb25zb2xlLmxvZyhgUGVybWlzc2lvbnMgc2V0LCBhcHBseWluZyBkZXZpY2UgY2hhbmdlJHtkZXZpY2UgPyBgICgke2RldmljZS5kZXZpY2VJZH0pYCA6ICcnfS5gKSlcclxuICAgICAgLy8gICApXHJcbiAgICAgIC8vICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLmRldmljZSA9IGRldmljZSk7XHJcbiAgICAgIC8vIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpbiBvcmRlciB0byBjaGFuZ2UgdGhlIGRldmljZSB0aGUgY29kZVJlYWRlciBnb3R0YSBiZSByZXNldGVkXHJcbiAgICB0aGlzLl9yZXNldCgpO1xyXG5cclxuICAgIHRoaXMuX2RldmljZSA9IGRldmljZTtcclxuXHJcbiAgICAvLyBpZiBlbmFibGVkLCBzdGFydHMgc2Nhbm5pbmdcclxuICAgIGlmICh0aGlzLl9lbmFibGVkICYmIGRldmljZSAhPT0gbnVsbCkge1xyXG4gICAgICB0aGlzLnNjYW5Gcm9tRGV2aWNlKGRldmljZS5kZXZpY2VJZCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbWl0cyB3aGVuIHRoZSBjdXJyZW50IGRldmljZSBpcyBjaGFuZ2VkLlxyXG4gICAqL1xyXG4gIEBPdXRwdXQoKVxyXG4gIGRldmljZUNoYW5nZTogRXZlbnRFbWl0dGVyPE1lZGlhRGV2aWNlSW5mbz47XHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZXIgZGV2aWNlIGFjZXNzb3IuXHJcbiAgICovXHJcbiAgZ2V0IGRldmljZSgpIHtcclxuICAgIHJldHVybiB0aGlzLl9kZXZpY2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFsbCB0aGUgcmVnaXN0ZXJlZCBmb3JtYXRzLlxyXG4gICAqL1xyXG4gIGdldCBmb3JtYXRzKCk6IEJhcmNvZGVGb3JtYXRbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5oaW50cy5nZXQoRGVjb2RlSGludFR5cGUuUE9TU0lCTEVfRk9STUFUUyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWdpc3RlcnMgZm9ybWF0cyB0aGUgc2Nhbm5lciBzaG91bGQgc3VwcG9ydC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBpbnB1dCBCYXJjb2RlRm9ybWF0IG9yIGNhc2UtaW5zZW5zaXRpdmUgc3RyaW5nIGFycmF5LlxyXG4gICAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgc2V0IGZvcm1hdHMoaW5wdXQ6IEJhcmNvZGVGb3JtYXRbXSkge1xyXG5cclxuICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBmb3JtYXRzLCBtYWtlIHN1cmUgdGhlIFtmb3JtYXRzXSBpbnB1dCBpcyBhIGJpbmRpbmcuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZm9ybWF0cyBtYXkgYmUgc2V0IGZyb20gaHRtbCB0ZW1wbGF0ZSBhcyBCYXJjb2RlRm9ybWF0IG9yIHN0cmluZyBhcnJheVxyXG4gICAgY29uc3QgZm9ybWF0cyA9IGlucHV0Lm1hcChmID0+IHRoaXMuZ2V0QmFyY29kZUZvcm1hdE9yRmFpbChmKSk7XHJcblxyXG4gICAgY29uc3QgaGludHMgPSB0aGlzLmhpbnRzO1xyXG5cclxuICAgIC8vIHVwZGF0ZXMgdGhlIGhpbnRzXHJcbiAgICBoaW50cy5zZXQoRGVjb2RlSGludFR5cGUuUE9TU0lCTEVfRk9STUFUUywgZm9ybWF0cyk7XHJcblxyXG4gICAgdGhpcy5oaW50cyA9IGhpbnRzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbGwgdGhlIHJlZ2lzdGVyZWQgaGludHMuXHJcbiAgICovXHJcbiAgZ2V0IGhpbnRzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX2hpbnRzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRG9lcyB3aGF0IGl0IHRha2VzIHRvIHNldCB0aGUgaGludHMuXHJcbiAgICovXHJcbiAgc2V0IGhpbnRzKGhpbnRzOiBNYXA8RGVjb2RlSGludFR5cGUsIGFueT4pIHtcclxuXHJcbiAgICB0aGlzLl9oaW50cyA9IGhpbnRzO1xyXG5cclxuICAgIC8vIEBub3RlIGF2b2lkIHJlc3RhcnRpbmcgdGhlIGNvZGUgcmVhZGVyIHdoZW4gcG9zc2libGVcclxuXHJcbiAgICAvLyBuZXcgaW5zdGFuY2Ugd2l0aCBuZXcgaGludHMuXHJcbiAgICB0aGlzLnJlc3RhcnQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICovXHJcbiAgc2V0IGlzQXV0b3N0YXJ0aW5nKHN0YXRlOiBib29sZWFuIHwgbnVsbCkge1xyXG4gICAgdGhpcy5faXNBdXRvc3RhcnRpbmcgPSBzdGF0ZTtcclxuICAgIHRoaXMuYXV0b3N0YXJ0aW5nLm5leHQoc3RhdGUpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKi9cclxuICBnZXQgaXNBdXRzdGFydGluZygpOiBib29sZWFuIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5faXNBdXRvc3RhcnRpbmc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGxvdyBzdGFydCBzY2FuIG9yIG5vdC5cclxuICAgKi9cclxuICBASW5wdXQoKVxyXG4gIHNldCB0b3JjaChvbjogYm9vbGVhbikge1xyXG4gICAgdGhpcy5nZXRDb2RlUmVhZGVyKCkuc2V0VG9yY2gob24pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWxsb3cgc3RhcnQgc2NhbiBvciBub3QuXHJcbiAgICovXHJcbiAgQElucHV0KClcclxuICBzZXQgZW5hYmxlKGVuYWJsZWQ6IGJvb2xlYW4pIHtcclxuXHJcbiAgICB0aGlzLl9lbmFibGVkID0gQm9vbGVhbihlbmFibGVkKTtcclxuXHJcbiAgICBpZiAoIXRoaXMuX2VuYWJsZWQpIHtcclxuICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLmRldmljZSkge1xyXG4gICAgICB0aGlzLnNjYW5Gcm9tRGV2aWNlKHRoaXMuZGV2aWNlLmRldmljZUlkKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRlbGxzIGlmIHRoZSBzY2FubmVyIGlzIGVuYWJsZWQgb3Igbm90LlxyXG4gICAqL1xyXG4gIGdldCBlbmFibGVkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJZiBpcyBgdHJ5SGFyZGVyYCBlbmFibGVkLlxyXG4gICAqL1xyXG4gIGdldCB0cnlIYXJkZXIoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5oaW50cy5nZXQoRGVjb2RlSGludFR5cGUuVFJZX0hBUkRFUik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbmFibGUvZGlzYWJsZSB0cnlIYXJkZXIgaGludC5cclxuICAgKi9cclxuICBASW5wdXQoKVxyXG4gIHNldCB0cnlIYXJkZXIoZW5hYmxlOiBib29sZWFuKSB7XHJcblxyXG4gICAgY29uc3QgaGludHMgPSB0aGlzLmhpbnRzO1xyXG5cclxuICAgIGlmIChlbmFibGUpIHtcclxuICAgICAgaGludHMuc2V0KERlY29kZUhpbnRUeXBlLlRSWV9IQVJERVIsIHRydWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGludHMuZGVsZXRlKERlY29kZUhpbnRUeXBlLlRSWV9IQVJERVIpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaGludHMgPSBoaW50cztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN0cnVjdG9yIHRvIGJ1aWxkIHRoZSBvYmplY3QgYW5kIGRvIHNvbWUgREkuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAvLyBpbnN0YW5jZSBiYXNlZCBlbWl0dGVyc1xyXG4gICAgdGhpcy5hdXRvc3RhcnRlZCA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcclxuICAgIHRoaXMuYXV0b3N0YXJ0aW5nID0gbmV3IEV2ZW50RW1pdHRlcigpO1xyXG4gICAgdGhpcy50b3JjaENvbXBhdGlibGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XHJcbiAgICB0aGlzLnNjYW5TdWNjZXNzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xyXG4gICAgdGhpcy5zY2FuRmFpbHVyZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcclxuICAgIHRoaXMuc2NhbkVycm9yID0gbmV3IEV2ZW50RW1pdHRlcigpO1xyXG4gICAgdGhpcy5zY2FuQ29tcGxldGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XHJcbiAgICB0aGlzLmNhbWVyYXNGb3VuZCA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcclxuICAgIHRoaXMuY2FtZXJhc05vdEZvdW5kID0gbmV3IEV2ZW50RW1pdHRlcigpO1xyXG4gICAgdGhpcy5wZXJtaXNzaW9uUmVzcG9uc2UgPSBuZXcgRXZlbnRFbWl0dGVyKHRydWUpO1xyXG4gICAgdGhpcy5oYXNEZXZpY2VzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xyXG4gICAgdGhpcy5kZXZpY2VDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XHJcblxyXG4gICAgdGhpcy5fZGV2aWNlID0gbnVsbDtcclxuICAgIHRoaXMuX2VuYWJsZWQgPSB0cnVlO1xyXG4gICAgdGhpcy5faGludHMgPSBuZXcgTWFwPERlY29kZUhpbnRUeXBlLCBhbnk+KCk7XHJcbiAgICB0aGlzLmF1dG9mb2N1c0VuYWJsZWQgPSB0cnVlO1xyXG4gICAgdGhpcy5hdXRvc3RhcnQgPSB0cnVlO1xyXG4gICAgdGhpcy5mb3JtYXRzID0gW0JhcmNvZGVGb3JtYXQuUVJfQ09ERV07XHJcblxyXG4gICAgLy8gY29tcHV0ZWQgZGF0YVxyXG4gICAgdGhpcy5oYXNOYXZpZ2F0b3IgPSB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJztcclxuICAgIHRoaXMuaXNNZWRpYURldmljZXNTdXBvcnRlZCA9IHRoaXMuaGFzTmF2aWdhdG9yICYmICEhbmF2aWdhdG9yLm1lZGlhRGV2aWNlcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgYW5kIHJlZ2lzdGVycyBhbGwgY2FtbWVyYXMuXHJcbiAgICovXHJcbiAgYXN5bmMgYXNrRm9yUGVybWlzc2lvbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuXHJcbiAgICBpZiAoIXRoaXMuaGFzTmF2aWdhdG9yKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0B6eGluZy9uZ3gtc2Nhbm5lcicsICdDYW5cXCd0IGFzayBwZXJtaXNzaW9uLCBuYXZpZ2F0b3IgaXMgbm90IHByZXNlbnQuJyk7XHJcbiAgICAgIHRoaXMuc2V0UGVybWlzc2lvbihudWxsKTtcclxuICAgICAgcmV0dXJuIHRoaXMuaGFzUGVybWlzc2lvbjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuaXNNZWRpYURldmljZXNTdXBvcnRlZCkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdAenhpbmcvbmd4LXNjYW5uZXInLCAnQ2FuXFwndCBnZXQgdXNlciBtZWRpYSwgdGhpcyBpcyBub3Qgc3VwcG9ydGVkLicpO1xyXG4gICAgICB0aGlzLnNldFBlcm1pc3Npb24obnVsbCk7XHJcbiAgICAgIHJldHVybiB0aGlzLmhhc1Blcm1pc3Npb247XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHN0cmVhbTogTWVkaWFTdHJlYW07XHJcbiAgICBsZXQgcGVybWlzc2lvbjogYm9vbGVhbjtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBXaWxsIHRyeSB0byBhc2sgZm9yIHBlcm1pc3Npb25cclxuICAgICAgc3RyZWFtID0gYXdhaXQgdGhpcy5nZXRBbnlWaWRlb0RldmljZSgpO1xyXG4gICAgICBwZXJtaXNzaW9uID0gISFzdHJlYW07XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlUGVybWlzc2lvbkV4Y2VwdGlvbihlcnIpO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgdGhpcy50ZXJtaW5hdGVTdHJlYW0oc3RyZWFtKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNldFBlcm1pc3Npb24ocGVybWlzc2lvbik7XHJcblxyXG4gICAgLy8gUmV0dXJucyB0aGUgcGVybWlzc2lvblxyXG4gICAgcmV0dXJuIHBlcm1pc3Npb247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqL1xyXG4gIGdldEFueVZpZGVvRGV2aWNlKCk6IFByb21pc2U8TWVkaWFTdHJlYW0+IHtcclxuICAgIHJldHVybiBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7IHZpZGVvOiB0cnVlIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGVybWluYXRlcyBhIHN0cmVhbSBhbmQgaXQncyB0cmFja3MuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSB0ZXJtaW5hdGVTdHJlYW0oc3RyZWFtOiBNZWRpYVN0cmVhbSkge1xyXG5cclxuICAgIGlmIChzdHJlYW0pIHtcclxuICAgICAgc3RyZWFtLmdldFRyYWNrcygpLmZvckVhY2godCA9PiB0LnN0b3AoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RyZWFtID0gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGNvbXBvbmVudCB3aXRob3V0IHN0YXJ0aW5nIHRoZSBzY2FubmVyLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgaW5pdEF1dG9zdGFydE9mZigpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBkbyBub3QgYXNrIGZvciBwZXJtaXNzaW9uIHdoZW4gYXV0b3N0YXJ0IGlzIG9mZlxyXG4gICAgdGhpcy5pc0F1dG9zdGFydGluZyA9IG51bGw7XHJcblxyXG4gICAgLy8ganVzdCB1cGRhdGUgZGV2aWNlcyBpbmZvcm1hdGlvblxyXG4gICAgdGhpcy51cGRhdGVWaWRlb0lucHV0RGV2aWNlcygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGNvbXBvbmVudCBhbmQgc3RhcnRzIHRoZSBzY2FubmVyLlxyXG4gICAqIFBlcm1pc3Npb25zIGFyZSBhc2tlZCB0byBhY2NvbXBsaXNoIHRoYXQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhc3luYyBpbml0QXV0b3N0YXJ0T24oKTogUHJvbWlzZTx2b2lkPiB7XHJcblxyXG4gICAgdGhpcy5pc0F1dG9zdGFydGluZyA9IHRydWU7XHJcblxyXG4gICAgbGV0IGhhc1Blcm1pc3Npb246IGJvb2xlYW47XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gQXNrcyBmb3IgcGVybWlzc2lvbiBiZWZvcmUgZW51bWVyYXRpbmcgZGV2aWNlcyBzbyBpdCBjYW4gZ2V0IGFsbCB0aGUgZGV2aWNlJ3MgaW5mb1xyXG4gICAgICBoYXNQZXJtaXNzaW9uID0gYXdhaXQgdGhpcy5hc2tGb3JQZXJtaXNzaW9uKCk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0V4Y2VwdGlvbiBvY2N1cnJlZCB3aGlsZSBhc2tpbmcgZm9yIHBlcm1pc3Npb246JywgZSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBmcm9tIHRoaXMgcG9pbnQsIHRoaW5ncyBnb25uYSBuZWVkIHBlcm1pc3Npb25zXHJcbiAgICBpZiAoaGFzUGVybWlzc2lvbikge1xyXG4gICAgICBjb25zdCBkZXZpY2VzID0gYXdhaXQgdGhpcy51cGRhdGVWaWRlb0lucHV0RGV2aWNlcygpO1xyXG4gICAgICB0aGlzLmF1dG9zdGFydFNjYW5uZXIoWy4uLmRldmljZXNdKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gZGV2aWNlIGlzIHRoZSBjdXJyZW50IGRlZmluZWQgb25lLlxyXG4gICAqL1xyXG4gIGlzQ3VycmVudERldmljZShkZXZpY2U6IE1lZGlhRGV2aWNlSW5mbykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGV2aWNlICYmIGRldmljZSAmJiBkZXZpY2UuZGV2aWNlSWQgPT09IHRoaXMuZGV2aWNlLmRldmljZUlkO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXhlY3V0ZWQgYWZ0ZXIgdGhlIHZpZXcgaW5pdGlhbGl6YXRpb24uXHJcbiAgICovXHJcbiAgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xyXG5cclxuICAgIC8vIG1ha2VzIHRvcmNoIGF2YWlsYWJpbGl0eSBpbmZvcm1hdGlvbiBhdmFpbGFibGUgdG8gdXNlclxyXG4gICAgdGhpcy5nZXRDb2RlUmVhZGVyKCkuaXNUb3JjaEF2YWlsYWJsZS5zdWJzY3JpYmUoeCA9PiB0aGlzLnRvcmNoQ29tcGF0aWJsZS5lbWl0KHgpKTtcclxuXHJcbiAgICBpZiAoIXRoaXMuYXV0b3N0YXJ0KSB7XHJcbiAgICAgIGNvbnNvbGUud2FybignTmV3IGZlYXR1cmUgXFwnYXV0b3N0YXJ0XFwnIGRpc2FibGVkLCBiZSBjYXJlZnVsLiBQZXJtaXNzaW9ucyBhbmQgZGV2aWNlcyByZWNvdmVyeSBoYXMgdG8gYmUgcnVuIG1hbnVhbGx5LicpO1xyXG5cclxuICAgICAgLy8gZG9lcyB0aGUgbmVjZXNzYXJ5IGNvbmZpZ3VyYXRpb24gd2l0aG91dCBhdXRvc3RhcnRpbmdcclxuICAgICAgdGhpcy5pbml0QXV0b3N0YXJ0T2ZmKCk7XHJcblxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29uZmlndXJhdGVzIHRoZSBjb21wb25lbnQgYW5kIHN0YXJ0cyB0aGUgc2Nhbm5lclxyXG4gICAgdGhpcy5pbml0QXV0b3N0YXJ0T24oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEV4ZWN1dGVzIHNvbWUgYWN0aW9ucyBiZWZvcmUgZGVzdHJveSB0aGUgY29tcG9uZW50LlxyXG4gICAqL1xyXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xyXG4gICAgdGhpcy5yZXNldCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3RvcHMgb2xkIGBjb2RlUmVhZGVyYCBhbmQgc3RhcnRzIHNjYW5uaW5nIGluIGEgbmV3IG9uZS5cclxuICAgKi9cclxuICByZXN0YXJ0KCk6IHZvaWQge1xyXG5cclxuICAgIGNvbnN0IHByZXZEZXZpY2UgPSB0aGlzLl9yZXNldCgpO1xyXG5cclxuICAgIGlmICghcHJldkRldmljZSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQG5vdGUgYXBlbmFzIG5lY2Vzc2FyaW8gcG9yIGVucXVhbnRvIGNhdXNhIGRhIFRvcmNoXHJcbiAgICB0aGlzLl9jb2RlUmVhZGVyID0gdW5kZWZpbmVkO1xyXG4gICAgdGhpcy5kZXZpY2UgPSBwcmV2RGV2aWNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGlzY292ZXJzIGFuZCB1cGRhdGVzIGtub3duIHZpZGVvIGlucHV0IGRldmljZXMuXHJcbiAgICovXHJcbiAgYXN5bmMgdXBkYXRlVmlkZW9JbnB1dERldmljZXMoKTogUHJvbWlzZTxNZWRpYURldmljZUluZm9bXT4ge1xyXG5cclxuICAgIC8vIHBlcm1pc3Npb25zIGFyZW4ndCBuZWVkZWQgdG8gZ2V0IGRldmljZXMsIGJ1dCB0byBhY2Nlc3MgdGhlbSBhbmQgdGhlaXIgaW5mb1xyXG4gICAgY29uc3QgZGV2aWNlcyA9IGF3YWl0IHRoaXMuZ2V0Q29kZVJlYWRlcigpLmxpc3RWaWRlb0lucHV0RGV2aWNlcygpIHx8IFtdO1xyXG4gICAgY29uc3QgaGFzRGV2aWNlcyA9IGRldmljZXMgJiYgZGV2aWNlcy5sZW5ndGggPiAwO1xyXG5cclxuICAgIC8vIHN0b3JlcyBkaXNjb3ZlcmVkIGRldmljZXMgYW5kIHVwZGF0ZXMgaW5mb3JtYXRpb25cclxuICAgIHRoaXMuaGFzRGV2aWNlcy5uZXh0KGhhc0RldmljZXMpO1xyXG4gICAgdGhpcy5jYW1lcmFzRm91bmQubmV4dChbLi4uZGV2aWNlc10pO1xyXG5cclxuICAgIGlmICghaGFzRGV2aWNlcykge1xyXG4gICAgICB0aGlzLmNhbWVyYXNOb3RGb3VuZC5uZXh0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGRldmljZXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdGFydHMgdGhlIHNjYW5uZXIgd2l0aCB0aGUgYmFjayBjYW1lcmEgb3RoZXJ3aXNlIHRha2UgdGhlIGxhc3RcclxuICAgKiBhdmFpbGFibGUgZGV2aWNlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgYXV0b3N0YXJ0U2Nhbm5lcihkZXZpY2VzOiBNZWRpYURldmljZUluZm9bXSkge1xyXG5cclxuICAgIGNvbnN0IG1hdGNoZXIgPSAoeyBsYWJlbCB9KSA9PiAvYmFja3x0csOhc3xyZWFyfHRyYXNlaXJhfGVudmlyb25tZW50fGFtYmllbnRlL2dpLnRlc3QobGFiZWwpO1xyXG5cclxuICAgIC8vIHNlbGVjdCB0aGUgcmVhciBjYW1lcmEgYnkgZGVmYXVsdCwgb3RoZXJ3aXNlIHRha2UgdGhlIGxhc3QgY2FtZXJhLlxyXG4gICAgY29uc3QgZGV2aWNlID0gZGV2aWNlcy5maW5kKG1hdGNoZXIpIHx8IGRldmljZXMucG9wKCk7XHJcblxyXG4gICAgaWYgKCFkZXZpY2UpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbXBvc3NpYmxlIHRvIGF1dG9zdGFydCwgbm8gaW5wdXQgZGV2aWNlcyBhdmFpbGFibGUuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5kZXZpY2UgPSBkZXZpY2U7XHJcbiAgICAvLyBAbm90ZSB3aGVuIGxpc3RlbmluZyB0byB0aGlzIGNoYW5nZSwgY2FsbGJhY2sgY29kZSB3aWxsIHNvbWV0aW1lcyBydW4gYmVmb3JlIHRoZSBwcmV2aW91cyBsaW5lLlxyXG4gICAgdGhpcy5kZXZpY2VDaGFuZ2UuZW1pdChkZXZpY2UpO1xyXG5cclxuICAgIHRoaXMuaXNBdXRvc3RhcnRpbmcgPSBmYWxzZTtcclxuICAgIHRoaXMuYXV0b3N0YXJ0ZWQubmV4dCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGlzcGF0Y2hlcyB0aGUgc2NhbiBzdWNjZXNzIGV2ZW50LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHJlc3VsdCB0aGUgc2NhbiByZXN1bHQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBkaXNwYXRjaFNjYW5TdWNjZXNzKHJlc3VsdDogUmVzdWx0KTogdm9pZCB7XHJcbiAgICB0aGlzLnNjYW5TdWNjZXNzLm5leHQocmVzdWx0LmdldFRleHQoKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEaXNwYXRjaGVzIHRoZSBzY2FuIGZhaWx1cmUgZXZlbnQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBkaXNwYXRjaFNjYW5GYWlsdXJlKHJlYXNvbj86IEV4Y2VwdGlvbik6IHZvaWQge1xyXG4gICAgdGhpcy5zY2FuRmFpbHVyZS5uZXh0KHJlYXNvbik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEaXNwYXRjaGVzIHRoZSBzY2FuIGVycm9yIGV2ZW50LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGVycm9yIHRoZSBlcnJvciB0aGluZy5cclxuICAgKi9cclxuICBwcml2YXRlIGRpc3BhdGNoU2NhbkVycm9yKGVycm9yOiBhbnkpOiB2b2lkIHtcclxuICAgIHRoaXMuc2NhbkVycm9yLm5leHQoZXJyb3IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGlzcGF0Y2hlcyB0aGUgc2NhbiBldmVudC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSByZXN1bHQgdGhlIHNjYW4gcmVzdWx0LlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZGlzcGF0Y2hTY2FuQ29tcGxldGUocmVzdWx0OiBSZXN1bHQpOiB2b2lkIHtcclxuICAgIHRoaXMuc2NhbkNvbXBsZXRlLm5leHQocmVzdWx0KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGZpbHRlcmVkIHBlcm1pc3Npb24uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVQZXJtaXNzaW9uRXhjZXB0aW9uKGVycjogRE9NRXhjZXB0aW9uKTogYm9vbGVhbiB7XHJcblxyXG4gICAgLy8gZmFpbGVkIHRvIGdyYW50IHBlcm1pc3Npb24gdG8gdmlkZW8gaW5wdXRcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0B6eGluZy9uZ3gtc2Nhbm5lcicsICdFcnJvciB3aGVuIGFza2luZyBmb3IgcGVybWlzc2lvbi4nLCBlcnIpO1xyXG5cclxuICAgIGxldCBwZXJtaXNzaW9uOiBib29sZWFuO1xyXG5cclxuICAgIHN3aXRjaCAoZXJyLm5hbWUpIHtcclxuXHJcbiAgICAgIC8vIHVzdWFsbHkgY2F1c2VkIGJ5IG5vdCBzZWN1cmUgb3JpZ2luc1xyXG4gICAgICBjYXNlICdOb3RTdXBwb3J0ZWRFcnJvcic6XHJcbiAgICAgICAgY29uc29sZS53YXJuKCdAenhpbmcvbmd4LXNjYW5uZXInLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgLy8gY291bGQgbm90IGNsYWltXHJcbiAgICAgICAgcGVybWlzc2lvbiA9IG51bGw7XHJcbiAgICAgICAgLy8gY2FuJ3QgY2hlY2sgZGV2aWNlc1xyXG4gICAgICAgIHRoaXMuaGFzRGV2aWNlcy5uZXh0KG51bGwpO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgLy8gdXNlciBkZW5pZWQgcGVybWlzc2lvblxyXG4gICAgICBjYXNlICdOb3RBbGxvd2VkRXJyb3InOlxyXG4gICAgICAgIGNvbnNvbGUud2FybignQHp4aW5nL25neC1zY2FubmVyJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgIC8vIGNsYWltZWQgYW5kIGRlbmllZCBwZXJtaXNzaW9uXHJcbiAgICAgICAgcGVybWlzc2lvbiA9IGZhbHNlO1xyXG4gICAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCBpbnB1dCBkZXZpY2VzIGV4aXN0c1xyXG4gICAgICAgIHRoaXMuaGFzRGV2aWNlcy5uZXh0KHRydWUpO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgLy8gdGhlIGRldmljZSBoYXMgbm8gYXR0YWNoZWQgaW5wdXQgZGV2aWNlc1xyXG4gICAgICBjYXNlICdOb3RGb3VuZEVycm9yJzpcclxuICAgICAgICBjb25zb2xlLndhcm4oJ0B6eGluZy9uZ3gtc2Nhbm5lcicsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICAvLyBubyBwZXJtaXNzaW9ucyBjbGFpbWVkXHJcbiAgICAgICAgcGVybWlzc2lvbiA9IG51bGw7XHJcbiAgICAgICAgLy8gYmVjYXVzZSB0aGVyZSB3YXMgbm8gZGV2aWNlc1xyXG4gICAgICAgIHRoaXMuaGFzRGV2aWNlcy5uZXh0KGZhbHNlKTtcclxuICAgICAgICAvLyB0ZWxscyB0aGUgbGlzdGVuZXIgYWJvdXQgdGhlIGVycm9yXHJcbiAgICAgICAgdGhpcy5jYW1lcmFzTm90Rm91bmQubmV4dChlcnIpO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSAnTm90UmVhZGFibGVFcnJvcic6XHJcbiAgICAgICAgY29uc29sZS53YXJuKCdAenhpbmcvbmd4LXNjYW5uZXInLCAnQ291bGRuXFwndCByZWFkIHRoZSBkZXZpY2UocylcXCdzIHN0cmVhbSwgaXRcXCdzIHByb2JhYmx5IGluIHVzZSBieSBhbm90aGVyIGFwcC4nKTtcclxuICAgICAgICAvLyBubyBwZXJtaXNzaW9ucyBjbGFpbWVkXHJcbiAgICAgICAgcGVybWlzc2lvbiA9IG51bGw7XHJcbiAgICAgICAgLy8gdGhlcmUgYXJlIGRldmljZXMsIHdoaWNoIEkgY291bGRuJ3QgdXNlXHJcbiAgICAgICAgdGhpcy5oYXNEZXZpY2VzLm5leHQoZmFsc2UpO1xyXG4gICAgICAgIC8vIHRlbGxzIHRoZSBsaXN0ZW5lciBhYm91dCB0aGUgZXJyb3JcclxuICAgICAgICB0aGlzLmNhbWVyYXNOb3RGb3VuZC5uZXh0KGVycik7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIGNvbnNvbGUud2FybignQHp4aW5nL25neC1zY2FubmVyJywgJ0kgd2FzIG5vdCBhYmxlIHRvIGRlZmluZSBpZiBJIGhhdmUgcGVybWlzc2lvbnMgZm9yIGNhbWVyYSBvciBub3QuJywgZXJyKTtcclxuICAgICAgICAvLyB1bmtub3duXHJcbiAgICAgICAgcGVybWlzc2lvbiA9IG51bGw7XHJcbiAgICAgICAgLy8gdGhpcy5oYXNEZXZpY2VzLm5leHQodW5kZWZpbmVkO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNldFBlcm1pc3Npb24ocGVybWlzc2lvbik7XHJcblxyXG4gICAgLy8gdGVsbHMgdGhlIGxpc3RlbmVyIGFib3V0IHRoZSBlcnJvclxyXG4gICAgdGhpcy5wZXJtaXNzaW9uUmVzcG9uc2UuZXJyb3IoZXJyKTtcclxuXHJcbiAgICByZXR1cm4gcGVybWlzc2lvbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB2YWxpZCBCYXJjb2RlRm9ybWF0IG9yIGZhaWxzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0QmFyY29kZUZvcm1hdE9yRmFpbChmb3JtYXQ6IHN0cmluZyB8IEJhcmNvZGVGb3JtYXQpOiBCYXJjb2RlRm9ybWF0IHtcclxuICAgIHJldHVybiB0eXBlb2YgZm9ybWF0ID09PSAnc3RyaW5nJ1xyXG4gICAgICA/IEJhcmNvZGVGb3JtYXRbZm9ybWF0LnRyaW0oKS50b1VwcGVyQ2FzZSgpXVxyXG4gICAgICA6IGZvcm1hdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldG9ybmEgdW0gY29kZSByZWFkZXIsIGNyaWEgdW0gc2UgbmVuaHVtZSBleGlzdGUuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRDb2RlUmVhZGVyKCk6IEJyb3dzZXJNdWx0aUZvcm1hdENvbnRpbnVvdXNSZWFkZXIge1xyXG5cclxuICAgIGlmICghdGhpcy5fY29kZVJlYWRlcikge1xyXG4gICAgICB0aGlzLl9jb2RlUmVhZGVyID0gbmV3IEJyb3dzZXJNdWx0aUZvcm1hdENvbnRpbnVvdXNSZWFkZXIodGhpcy5oaW50cyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuX2NvZGVSZWFkZXI7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdGFydHMgdGhlIGNvbnRpbnVvdXMgc2Nhbm5pbmcgZm9yIHRoZSBnaXZlbiBkZXZpY2UuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZGV2aWNlSWQgVGhlIGRldmljZUlkIGZyb20gdGhlIGRldmljZS5cclxuICAgKi9cclxuICBwcml2YXRlIHNjYW5Gcm9tRGV2aWNlKGRldmljZUlkOiBzdHJpbmcpOiB2b2lkIHtcclxuXHJcbiAgICBjb25zdCB2aWRlb0VsZW1lbnQgPSB0aGlzLnByZXZpZXdFbGVtUmVmLm5hdGl2ZUVsZW1lbnQ7XHJcblxyXG4gICAgY29uc3QgY29kZVJlYWRlciA9IHRoaXMuZ2V0Q29kZVJlYWRlcigpO1xyXG5cclxuICAgIGNvbnN0IGRlY29kaW5nU3RyZWFtID0gY29kZVJlYWRlci5jb250aW51b3VzRGVjb2RlRnJvbUlucHV0VmlkZW9EZXZpY2UoZGV2aWNlSWQsIHZpZGVvRWxlbWVudCk7XHJcblxyXG4gICAgaWYgKCFkZWNvZGluZ1N0cmVhbSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZGVmaW5lZCBkZWNvZGluZyBzdHJlYW0sIGFib3J0aW5nLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG5leHQgPSAoeDogUmVzdWx0QW5kRXJyb3IpID0+IHRoaXMuX29uRGVjb2RlUmVzdWx0KHgucmVzdWx0LCB4LmVycm9yKTtcclxuICAgIGNvbnN0IGVycm9yID0gKGVycjogYW55KSA9PiB0aGlzLl9vbkRlY29kZUVycm9yKGVycik7XHJcbiAgICBjb25zdCBjb21wbGV0ZSA9ICgpID0+IHsgdGhpcy5yZXNldCgpOyBjb25zb2xlLmxvZygnY29tcGxldGVkJyk7IH07XHJcblxyXG4gICAgZGVjb2RpbmdTdHJlYW0uc3Vic2NyaWJlKG5leHQsIGVycm9yLCBjb21wbGV0ZSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGVzIGRlY29kZSBlcnJvcnMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfb25EZWNvZGVFcnJvcihlcnI6IGFueSkge1xyXG4gICAgdGhpcy5kaXNwYXRjaFNjYW5FcnJvcihlcnIpO1xyXG4gICAgdGhpcy5yZXNldCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlcyBkZWNvZGUgcmVzdWx0cy5cclxuICAgKi9cclxuICBwcml2YXRlIF9vbkRlY29kZVJlc3VsdChyZXN1bHQ6IFJlc3VsdCwgZXJyb3I6IEV4Y2VwdGlvbik6IHZvaWQge1xyXG5cclxuICAgIGlmIChyZXN1bHQpIHtcclxuICAgICAgdGhpcy5kaXNwYXRjaFNjYW5TdWNjZXNzKHJlc3VsdCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmRpc3BhdGNoU2NhbkZhaWx1cmUoZXJyb3IpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZGlzcGF0Y2hTY2FuQ29tcGxldGUocmVzdWx0KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN0b3BzIHRoZSBjb2RlIHJlYWRlciBhbmQgcmV0dXJucyB0aGUgcHJldmlvdXMgc2VsZWN0ZWQgZGV2aWNlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX3Jlc2V0KCk6IE1lZGlhRGV2aWNlSW5mbyB7XHJcblxyXG4gICAgaWYgKCF0aGlzLl9jb2RlUmVhZGVyKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkZXZpY2UgPSB0aGlzLmRldmljZTtcclxuICAgIC8vIGRvIG5vdCBzZXQgdGhpcy5kZXZpY2UgaW5zaWRlIHRoaXMgbWV0aG9kLCBpdCB3b3VsZCBjcmVhdGUgYSByZWN1cnNpdmUgbG9vcFxyXG4gICAgdGhpcy5fZGV2aWNlID0gbnVsbDtcclxuXHJcbiAgICB0aGlzLl9jb2RlUmVhZGVyLnJlc2V0KCk7XHJcblxyXG4gICAgcmV0dXJuIGRldmljZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc2V0cyB0aGUgc2Nhbm5lciBhbmQgZW1pdHMgZGV2aWNlIGNoYW5nZS5cclxuICAgKi9cclxuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9yZXNldCgpO1xyXG4gICAgdGhpcy5kZXZpY2VDaGFuZ2UuZW1pdChudWxsKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHBlcm1pc3Npb24gdmFsdWUgYW5kIGVtbWl0cyB0aGUgZXZlbnQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzZXRQZXJtaXNzaW9uKGhhc1Blcm1pc3Npb246IGJvb2xlYW4gfCBudWxsKTogdm9pZCB7XHJcbiAgICB0aGlzLmhhc1Blcm1pc3Npb24gPSBoYXNQZXJtaXNzaW9uO1xyXG4gICAgdGhpcy5wZXJtaXNzaW9uUmVzcG9uc2UubmV4dChoYXNQZXJtaXNzaW9uKTtcclxuICB9XHJcblxyXG59XHJcbiJdfQ==