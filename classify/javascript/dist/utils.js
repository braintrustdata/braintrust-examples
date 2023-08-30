"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDataset = exports.buildHuggingFaceUrl = exports.printSection = exports.initializeOpenAI = exports.runOnAllTitles = exports.analyzeExperiment = exports.getCategoryFromResponse = exports.classifyTitle = void 0;
var openai_1 = require("openai");
var braintrust = require("braintrust");
var NUM_TITLES = 100;
var DATA_FILE_PATH = "";
var fs = require("fs");
// Define some helper functions for classifying titles.
function classifyTitle(openai, prompt, title) {
    return __awaiter(this, void 0, void 0, function () {
        var messages, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    messages = [
                        {
                            role: "system",
                            content: prompt,
                        },
                        {
                            role: "user",
                            content: "Article title: ".concat(title.text),
                        },
                    ];
                    return [4 /*yield*/, openai.createChatCompletion({
                            model: "gpt-3.5-turbo",
                            messages: messages,
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
            }
        });
    });
}
exports.classifyTitle = classifyTitle;
function getCategoryFromResponse(response) {
    if (response.choices.length == 0) {
        return '';
    }
    var choice = response.choices[0];
    if (!choice.message || !choice.message.content) {
        return '';
    }
    var content = choice.message.content;
    return content.toLowerCase();
}
exports.getCategoryFromResponse = getCategoryFromResponse;
function analyzeExperiment(name, prompt, dataset, responses) {
    return __awaiter(this, void 0, void 0, function () {
        var experiment, titles, i, title, response, responseCategory, expectedCategory;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, braintrust.init("classify-article-titles", {
                        experiment: name,
                    })];
                case 1:
                    experiment = _a.sent();
                    titles = dataset.titles;
                    for (i = 0; i < titles.length; i++) {
                        title = titles[i];
                        response = responses[i];
                        responseCategory = getCategoryFromResponse(response);
                        expectedCategory = dataset.categories[title.label].toLowerCase();
                        experiment.log({
                            inputs: { title: title.text },
                            output: responseCategory,
                            expected: expectedCategory,
                            metadata: {
                                "prompt": prompt,
                            },
                            scores: {
                                "match": responseCategory == expectedCategory ? 1 : 0,
                                "valid": dataset.categories.indexOf(responseCategory) != -1 ? 1 : 0,
                            },
                        });
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.analyzeExperiment = analyzeExperiment;
function runOnAllTitles(openai, prompt, titles) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, promises, ret, endTime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = performance.now();
                    promises = titles.map(function (title) { return classifyTitle(openai, prompt, title); });
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    ret = _a.sent();
                    endTime = performance.now();
                    console.log("Processed ".concat(titles.length, " titles in ").concat((endTime - startTime) / 1000, " seconds"));
                    return [2 /*return*/, ret];
            }
        });
    });
}
exports.runOnAllTitles = runOnAllTitles;
;
function initializeOpenAI() {
    var configuration = new openai_1.Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    var openai = new openai_1.OpenAIApi(configuration);
    return openai;
}
exports.initializeOpenAI = initializeOpenAI;
function printSection(sectionText) {
    console.log("");
    console.log("=".repeat(sectionText.length));
    console.log(sectionText);
    console.log("=".repeat(sectionText.length));
    console.log("");
}
exports.printSection = printSection;
function buildHuggingFaceUrl() {
    var baseUrl = "https://datasets-server.huggingface.co";
    var url = new URL("/rows", baseUrl);
    url.searchParams.set("dataset", "ag_news");
    url.searchParams.set("config", "default");
    url.searchParams.set("split", "test");
    url.searchParams.set("offset", "0");
    url.searchParams.set("limit", NUM_TITLES.toString());
    return url.toString();
}
exports.buildHuggingFaceUrl = buildHuggingFaceUrl;
function loadDataset() {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var jsonData, url, response, titles, _i, _b, row, categoriesFeature, categories;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    jsonData = {};
                    if (!(DATA_FILE_PATH && DATA_FILE_PATH.length > 0)) return [3 /*break*/, 1];
                    jsonData = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf8'));
                    return [3 /*break*/, 4];
                case 1:
                    url = buildHuggingFaceUrl();
                    return [4 /*yield*/, fetch(url)];
                case 2:
                    response = _c.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    jsonData = _c.sent();
                    _c.label = 4;
                case 4:
                    titles = [];
                    for (_i = 0, _b = jsonData["rows"]; _i < _b.length; _i++) {
                        row = _b[_i];
                        titles.push({
                            text: row["row"]["text"],
                            label: row["row"]["label"],
                        });
                    }
                    categoriesFeature = jsonData["features"].find(function (f) {
                        return f["name"] == "label";
                    });
                    categories = (((_a = categoriesFeature === null || categoriesFeature === void 0 ? void 0 : categoriesFeature.type) === null || _a === void 0 ? void 0 : _a.names) || []).map(function (c) { return c.toLowerCase(); });
                    return [2 /*return*/, {
                            titles: titles,
                            categories: categories,
                        }];
            }
        });
    });
}
exports.loadDataset = loadDataset;
