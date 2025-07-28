/* ========================================
   VALIDATION-UTILS.JS - Utilitaires de validation
   Chemin: src/js/shared/utils/validation-utils.js
   
   DESCRIPTION:
   Système complet de validation pour formulaires et données.
   Gère tous types de validation avec messages personnalisables et support multi-langues.
   
   STRUCTURE:
   1. Configuration et messages (lignes 20-300)
   2. Validations de types (lignes 305-450)
   3. Validations de chaînes (lignes 455-700)
   4. Validations de nombres (lignes 705-900)
   5. Validations de dates (lignes 905-1100)
   6. Validations de formats (lignes 1105-1400)
   7. Validations de fichiers (lignes 1405-1600)
   8. Validations personnalisées (lignes 1605-1800)
   9. Validations composées (lignes 1805-2000)
   10. Validateur principal (lignes 2005-2300)
   11. API publique (lignes 2305-2500)
   
   DÉPENDANCES:
   - Aucune dépendance externe
   - Peut être utilisé avec n'importe quel framework
   ======================================== */

const ValidationUtils = (() => {
    'use strict';
    
    // ========================================
    // CONFIGURATION ET MESSAGES
    // ========================================
    const CONFIG = {
        // Configuration globale
        defaultLocale: 'fr',
        throwOnError: false,
        validateOnBlur: true,
        validateOnChange: false,
        showMultipleErrors: false,
        customErrorClass: 'validation-error',
        customSuccessClass: 'validation-success',
        
        // Formats de validation
        formats: {
            email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            emailStrict: /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/,
            url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
            urlStrict: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i,
            phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/,
            phoneFR: /^(?:(?:\+|00)33[\s.-]{0,3}(?:\(0\)[\s.-]{0,3})?|0)[1-9](?:(?:[\s.-]?\d{2}){4}|\d{2}(?:[\s.-]?\d{3}){2})$/,
            phoneUS: /^(\+1|1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
            postalCodeFR: /^(0[1-9]|[1-8][0-9]|9[0-5]|2A|2B)[0-9]{3}$/,
            postalCodeUS: /^\d{5}(-\d{4})?$/,
            postalCodeCA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
            creditCard: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})$/,
            cvv: /^[0-9]{3,4}$/,
            ipv4: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            ipv6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
            hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i,
            slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            base64: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
            jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
            md5: /^[a-f0-9]{32}$/i,
            sha1: /^[a-f0-9]{40}$/i,
            sha256: /^[a-f0-9]{64}$/i,
            isbn10: /^(?:\d{9}X|\d{10})$/,
            isbn13: /^(?:\d{13})$/,
            iban: /^[A-Z]{2}\d{2}[A-Z0-9]+$/,
            bic: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
            macAddress: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
            coordinates: /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/,
            htmlTag: /<\/?[\w\s]*>|<.+[\W]>/,
            alphanumeric: /^[a-zA-Z0-9]+$/,
            alphanumericSpace: /^[a-zA-Z0-9\s]+$/,
            alphabetic: /^[a-zA-Z]+$/,
            alphabeticSpace: /^[a-zA-Z\s]+$/,
            numeric: /^[0-9]+$/,
            decimal: /^-?\d+\.?\d*$/,
            percentage: /^(100(\.0+)?|[1-9]?\d(\.\d+)?)%?$/,
            time24: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
            time12: /^(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM|am|pm)$/,
            dateISO: /^\d{4}-\d{2}-\d{2}$/,
            dateUS: /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/,
            dateFR: /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/,
            username: /^[a-zA-Z0-9_-]{3,16}$/,
            password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            passwordStrong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{12,}$/,
            twitterHandle: /^@?(\w){1,15}$/,
            githubRepo: /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/,
            version: /^\d+\.\d+\.\d+$/,
            semver: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
        },
        
        // Messages d'erreur multilingues
        messages: {
            fr: {
                required: 'Ce champ est obligatoire',
                email: 'Veuillez entrer une adresse email valide',
                url: 'Veuillez entrer une URL valide',
                phone: 'Veuillez entrer un numéro de téléphone valide',
                phoneFR: 'Veuillez entrer un numéro de téléphone français valide',
                minLength: 'Ce champ doit contenir au moins {min} caractères',
                maxLength: 'Ce champ ne doit pas dépasser {max} caractères',
                exactLength: 'Ce champ doit contenir exactement {length} caractères',
                minValue: 'La valeur doit être supérieure ou égale à {min}',
                maxValue: 'La valeur doit être inférieure ou égale à {max}',
                between: 'La valeur doit être comprise entre {min} et {max}',
                pattern: 'Le format de ce champ est invalide',
                alphanumeric: 'Ce champ ne doit contenir que des lettres et des chiffres',
                alphabetic: 'Ce champ ne doit contenir que des lettres',
                numeric: 'Ce champ ne doit contenir que des chiffres',
                decimal: 'Veuillez entrer un nombre décimal valide',
                integer: 'Veuillez entrer un nombre entier',
                date: 'Veuillez entrer une date valide',
                dateISO: 'Veuillez entrer une date au format AAAA-MM-JJ',
                dateBefore: 'La date doit être antérieure au {date}',
                dateAfter: 'La date doit être postérieure au {date}',
                dateBetween: 'La date doit être comprise entre {startDate} et {endDate}',
                time: 'Veuillez entrer une heure valide',
                creditCard: 'Veuillez entrer un numéro de carte bancaire valide',
                cvv: 'Veuillez entrer un code CVV valide',
                postalCode: 'Veuillez entrer un code postal valide',
                ipAddress: 'Veuillez entrer une adresse IP valide',
                macAddress: 'Veuillez entrer une adresse MAC valide',
                fileSize: 'La taille du fichier ne doit pas dépasser {maxSize}',
                fileType: 'Type de fichier non autorisé. Types acceptés : {types}',
                imageSize: 'Les dimensions de l\'image doivent être {width}x{height} pixels',
                username: 'Le nom d\'utilisateur doit contenir entre 3 et 16 caractères',
                password: 'Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules, chiffres et caractères spéciaux',
                passwordStrong: 'Le mot de passe doit contenir au moins 12 caractères avec majuscules, minuscules, chiffres et caractères spéciaux',
                passwordMatch: 'Les mots de passe ne correspondent pas',
                iban: 'Veuillez entrer un IBAN valide',
                bic: 'Veuillez entrer un code BIC/SWIFT valide',
                uuid: 'Veuillez entrer un UUID valide',
                json: 'Veuillez entrer un JSON valide',
                base64: 'Veuillez entrer une chaîne Base64 valide',
                hexColor: 'Veuillez entrer un code couleur hexadécimal valide',
                slug: 'Ce champ ne doit contenir que des lettres minuscules, chiffres et tirets',
                coordinates: 'Veuillez entrer des coordonnées GPS valides',
                unique: 'Cette valeur existe déjà',
                custom: 'La validation a échoué'
            },
            en: {
                required: 'This field is required',
                email: 'Please enter a valid email address',
                url: 'Please enter a valid URL',
                phone: 'Please enter a valid phone number',
                minLength: 'This field must contain at least {min} characters',
                maxLength: 'This field must not exceed {max} characters',
                exactLength: 'This field must contain exactly {length} characters',
                minValue: 'Value must be greater than or equal to {min}',
                maxValue: 'Value must be less than or equal to {max}',
                between: 'Value must be between {min} and {max}',
                pattern: 'Invalid format',
                alphanumeric: 'This field must contain only letters and numbers',
                alphabetic: 'This field must contain only letters',
                numeric: 'This field must contain only numbers',
                decimal: 'Please enter a valid decimal number',
                integer: 'Please enter a valid integer',
                date: 'Please enter a valid date',
                dateISO: 'Please enter a date in YYYY-MM-DD format',
                dateBefore: 'Date must be before {date}',
                dateAfter: 'Date must be after {date}',
                dateBetween: 'Date must be between {startDate} and {endDate}',
                time: 'Please enter a valid time',
                creditCard: 'Please enter a valid credit card number',
                cvv: 'Please enter a valid CVV code',
                postalCode: 'Please enter a valid postal code',
                ipAddress: 'Please enter a valid IP address',
                macAddress: 'Please enter a valid MAC address',
                fileSize: 'File size must not exceed {maxSize}',
                fileType: 'Invalid file type. Accepted types: {types}',
                imageSize: 'Image dimensions must be {width}x{height} pixels',
                username: 'Username must be between 3 and 16 characters',
                password: 'Password must contain at least 8 characters with uppercase, lowercase, numbers and special characters',
                passwordStrong: 'Password must contain at least 12 characters with uppercase, lowercase, numbers and special characters',
                passwordMatch: 'Passwords do not match',
                iban: 'Please enter a valid IBAN',
                bic: 'Please enter a valid BIC/SWIFT code',
                uuid: 'Please enter a valid UUID',
                json: 'Please enter valid JSON',
                base64: 'Please enter a valid Base64 string',
                hexColor: 'Please enter a valid hex color code',
                slug: 'This field must contain only lowercase letters, numbers and hyphens',
                coordinates: 'Please enter valid GPS coordinates',
                unique: 'This value already exists',
                custom: 'Validation failed'
            }
        }
    };
    
    // Langue actuelle
    let currentLocale = CONFIG.defaultLocale;
    
    // ========================================
    // VALIDATIONS DE TYPES
    // ========================================
    const TypeValidators = {
        isString(value) {
            return typeof value === 'string';
        },
        
        isNumber(value) {
            return typeof value === 'number' && !isNaN(value);
        },
        
        isBoolean(value) {
            return typeof value === 'boolean';
        },
        
        isArray(value) {
            return Array.isArray(value);
        },
        
        isObject(value) {
            return value !== null && typeof value === 'object' && !Array.isArray(value);
        },
        
        isFunction(value) {
            return typeof value === 'function';
        },
        
        isNull(value) {
            return value === null;
        },
        
        isUndefined(value) {
            return value === undefined;
        },
        
        isNullOrUndefined(value) {
            return value === null || value === undefined;
        },
        
        isDate(value) {
            return value instanceof Date && !isNaN(value);
        },
        
        isRegExp(value) {
            return value instanceof RegExp;
        },
        
        isPromise(value) {
            return value instanceof Promise || (value && typeof value.then === 'function');
        },
        
        isSymbol(value) {
            return typeof value === 'symbol';
        },
        
        isBigInt(value) {
            return typeof value === 'bigint';
        },
        
        isMap(value) {
            return value instanceof Map;
        },
        
        isSet(value) {
            return value instanceof Set;
        },
        
        isWeakMap(value) {
            return value instanceof WeakMap;
        },
        
        isWeakSet(value) {
            return value instanceof WeakSet;
        },
        
        isError(value) {
            return value instanceof Error;
        },
        
        isArrayBuffer(value) {
            return value instanceof ArrayBuffer;
        },
        
        isDataView(value) {
            return value instanceof DataView;
        },
        
        isTypedArray(value) {
            return ArrayBuffer.isView(value) && !(value instanceof DataView);
        },
        
        isPrimitive(value) {
            return value !== Object(value);
        },
        
        isEmpty(value) {
            if (value == null) return true;
            if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
            if (value instanceof Map || value instanceof Set) return value.size === 0;
            if (typeof value === 'object') return Object.keys(value).length === 0;
            return false;
        },
        
        isInteger(value) {
            return Number.isInteger(value);
        },
        
        isFloat(value) {
            return this.isNumber(value) && !Number.isInteger(value);
        },
        
        isFinite(value) {
            return Number.isFinite(value);
        },
        
        isInfinity(value) {
            return value === Infinity || value === -Infinity;
        },
        
        isNaN(value) {
            return Number.isNaN(value);
        },
        
        isSafeInteger(value) {
            return Number.isSafeInteger(value);
        }
    };
    
    // ========================================
    // VALIDATIONS DE CHAÎNES
    // ========================================
    const StringValidators = {
        minLength(value, min) {
            return String(value).length >= min;
        },
        
        maxLength(value, max) {
            return String(value).length <= max;
        },
        
        exactLength(value, length) {
            return String(value).length === length;
        },
        
        between(value, min, max) {
            const len = String(value).length;
            return len >= min && len <= max;
        },
        
        matches(value, pattern) {
            if (typeof pattern === 'string') {
                pattern = new RegExp(pattern);
            }
            return pattern.test(String(value));
        },
        
        contains(value, substring, caseSensitive = true) {
            if (!caseSensitive) {
                return String(value).toLowerCase().includes(String(substring).toLowerCase());
            }
            return String(value).includes(substring);
        },
        
        startsWith(value, prefix, caseSensitive = true) {
            if (!caseSensitive) {
                return String(value).toLowerCase().startsWith(String(prefix).toLowerCase());
            }
            return String(value).startsWith(prefix);
        },
        
        endsWith(value, suffix, caseSensitive = true) {
            if (!caseSensitive) {
                return String(value).toLowerCase().endsWith(String(suffix).toLowerCase());
            }
            return String(value).endsWith(suffix);
        },
        
        isLowercase(value) {
            return String(value) === String(value).toLowerCase();
        },
        
        isUppercase(value) {
            return String(value) === String(value).toUpperCase();
        },
        
        hasLowercase(value) {
            return /[a-z]/.test(String(value));
        },
        
        hasUppercase(value) {
            return /[A-Z]/.test(String(value));
        },
        
        hasNumeric(value) {
            return /\d/.test(String(value));
        },
        
        hasSpecialChar(value) {
            return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(String(value));
        },
        
        hasWhitespace(value) {
            return /\s/.test(String(value));
        },
        
        isAlphanumeric(value) {
            return CONFIG.formats.alphanumeric.test(String(value));
        },
        
        isAlphabetic(value) {
            return CONFIG.formats.alphabetic.test(String(value));
        },
        
        isNumeric(value) {
            return CONFIG.formats.numeric.test(String(value));
        },
        
        isHexadecimal(value) {
            return /^[0-9A-Fa-f]+$/.test(String(value));
        },
        
        isOctal(value) {
            return /^[0-7]+$/.test(String(value));
        },
        
        isBinary(value) {
            return /^[01]+$/.test(String(value));
        },
        
        isAscii(value) {
            return /^[\x00-\x7F]*$/.test(String(value));
        },
        
        isPrintableAscii(value) {
            return /^[\x20-\x7E]*$/.test(String(value));
        },
        
        isMultibyte(value) {
            return /[^\x00-\x7F]/.test(String(value));
        },
        
        isFullWidth(value) {
            return /[^\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/.test(String(value));
        },
        
        isHalfWidth(value) {
            return /[\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/.test(String(value));
        },
        
        isVariableWidth(value) {
            return this.isFullWidth(value) && this.isHalfWidth(value);
        },
        
        isSurrogatePair(value) {
            return /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(String(value));
        },
        
        isSlug(value) {
            return CONFIG.formats.slug.test(String(value));
        },
        
        isCamelCase(value) {
            return /^[a-z][a-zA-Z0-9]*$/.test(String(value));
        },
        
        isPascalCase(value) {
            return /^[A-Z][a-zA-Z0-9]*$/.test(String(value));
        },
        
        isSnakeCase(value) {
            return /^[a-z]+(_[a-z]+)*$/.test(String(value));
        },
        
        isKebabCase(value) {
            return /^[a-z]+(-[a-z]+)*$/.test(String(value));
        },
        
        isConstantCase(value) {
            return /^[A-Z]+(_[A-Z]+)*$/.test(String(value));
        }
    };
    
    // ========================================
    // VALIDATIONS DE NOMBRES
    // ========================================
    const NumberValidators = {
        min(value, min) {
            return Number(value) >= min;
        },
        
        max(value, max) {
            return Number(value) <= max;
        },
        
        between(value, min, max) {
            const num = Number(value);
            return num >= min && num <= max;
        },
        
        equals(value, target) {
            return Number(value) === Number(target);
        },
        
        notEquals(value, target) {
            return Number(value) !== Number(target);
        },
        
        isPositive(value) {
            return Number(value) > 0;
        },
        
        isNegative(value) {
            return Number(value) < 0;
        },
        
        isZero(value) {
            return Number(value) === 0;
        },
        
        isEven(value) {
            return Number(value) % 2 === 0;
        },
        
        isOdd(value) {
            return Number(value) % 2 !== 0;
        },
        
        isDivisibleBy(value, divisor) {
            return Number(value) % Number(divisor) === 0;
        },
        
        isPrime(value) {
            const num = Number(value);
            if (num <= 1) return false;
            if (num <= 3) return true;
            if (num % 2 === 0 || num % 3 === 0) return false;
            for (let i = 5; i * i <= num; i += 6) {
                if (num % i === 0 || num % (i + 2) === 0) return false;
            }
            return true;
        },
        
        isPerfectSquare(value) {
            const num = Number(value);
            const sqrt = Math.sqrt(num);
            return sqrt === Math.floor(sqrt);
        },
        
        isFibonacci(value) {
            const num = Number(value);
            const isPerfectSquare = (n) => {
                const s = Math.sqrt(n);
                return s === Math.floor(s);
            };
            return isPerfectSquare(5 * num * num + 4) || isPerfectSquare(5 * num * num - 4);
        },
        
        isPercentage(value) {
            return CONFIG.formats.percentage.test(String(value));
        },
        
        precision(value, decimals) {
            const parts = String(value).split('.');
            if (parts.length !== 2) return decimals === 0;
            return parts[1].length <= decimals;
        },
        
        multipleOf(value, multiple) {
            return Number(value) % Number(multiple) === 0;
        },
        
        inRange(value, ranges) {
            const num = Number(value);
            return ranges.some(range => {
                if (Array.isArray(range)) {
                    return num >= range[0] && num <= range[1];
                }
                return num === range;
            });
        },
        
        isLatitude(value) {
            const num = Number(value);
            return num >= -90 && num <= 90;
        },
        
        isLongitude(value) {
            const num = Number(value);
            return num >= -180 && num <= 180;
        },
        
        isPort(value) {
            const num = Number(value);
            return Number.isInteger(num) && num >= 0 && num <= 65535;
        }
    };
    
    // ========================================
    // VALIDATIONS DE DATES
    // ========================================
    const DateValidators = {
        isValidDate(value) {
            const date = new Date(value);
            return !isNaN(date.getTime());
        },
        
        isBefore(value, compareDate) {
            const date1 = new Date(value);
            const date2 = new Date(compareDate);
            return date1 < date2;
        },
        
        isAfter(value, compareDate) {
            const date1 = new Date(value);
            const date2 = new Date(compareDate);
            return date1 > date2;
        },
        
        isBetween(value, startDate, endDate) {
            const date = new Date(value);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return date >= start && date <= end;
        },
        
        isToday(value) {
            const date = new Date(value);
            const today = new Date();
            return date.toDateString() === today.toDateString();
        },
        
        isYesterday(value) {
            const date = new Date(value);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return date.toDateString() === yesterday.toDateString();
        },
        
        isTomorrow(value) {
            const date = new Date(value);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return date.toDateString() === tomorrow.toDateString();
        },
        
        isPast(value) {
            return new Date(value) < new Date();
        },
        
        isFuture(value) {
            return new Date(value) > new Date();
        },
        
        isWeekday(value) {
            const day = new Date(value).getDay();
            return day !== 0 && day !== 6;
        },
        
        isWeekend(value) {
            const day = new Date(value).getDay();
            return day === 0 || day === 6;
        },
        
        isLeapYear(value) {
            const year = new Date(value).getFullYear();
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        },
        
        isSameDay(value, compareDate) {
            const date1 = new Date(value);
            const date2 = new Date(compareDate);
            return date1.toDateString() === date2.toDateString();
        },
        
        isSameMonth(value, compareDate) {
            const date1 = new Date(value);
            const date2 = new Date(compareDate);
            return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
        },
        
        isSameYear(value, compareDate) {
            return new Date(value).getFullYear() === new Date(compareDate).getFullYear();
        },
        
        age(value, minAge, maxAge = null) {
            const birthDate = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            if (maxAge !== null) {
                return age >= minAge && age <= maxAge;
            }
            return age >= minAge;
        },
        
        isISO8601(value) {
            return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(String(value));
        },
        
        isRFC3339(value) {
            return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(String(value));
        },
        
        daysBetween(date1, date2) {
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            const diffTime = Math.abs(d2 - d1);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
    };
    
    // ========================================
    // VALIDATIONS DE FORMATS
    // ========================================
    const FormatValidators = {
        isEmail(value, strict = false) {
            return strict ? 
                CONFIG.formats.emailStrict.test(String(value)) : 
                CONFIG.formats.email.test(String(value));
        },
        
        isURL(value, strict = false) {
            return strict ? 
                CONFIG.formats.urlStrict.test(String(value)) : 
                CONFIG.formats.url.test(String(value));
        },
        
        isPhone(value, country = null) {
            switch (country) {
                case 'FR':
                    return CONFIG.formats.phoneFR.test(String(value));
                case 'US':
                    return CONFIG.formats.phoneUS.test(String(value));
                default:
                    return CONFIG.formats.phone.test(String(value));
            }
        },
        
        isPostalCode(value, country = 'FR') {
            switch (country) {
                case 'FR':
                    return CONFIG.formats.postalCodeFR.test(String(value));
                case 'US':
                    return CONFIG.formats.postalCodeUS.test(String(value));
                case 'CA':
                    return CONFIG.formats.postalCodeCA.test(String(value));
                default:
                    return true;
            }
        },
        
        isCreditCard(value) {
            const cleaned = String(value).replace(/\s+/g, '');
            if (!CONFIG.formats.creditCard.test(cleaned)) return false;
            
            // Algorithme de Luhn
            let sum = 0;
            let isEven = false;
            
            for (let i = cleaned.length - 1; i >= 0; i--) {
                let digit = parseInt(cleaned[i], 10);
                
                if (isEven) {
                    digit *= 2;
                    if (digit > 9) {
                        digit -= 9;
                    }
                }
                
                sum += digit;
                isEven = !isEven;
            }
            
            return sum % 10 === 0;
        },
        
        isCVV(value) {
            return CONFIG.formats.cvv.test(String(value));
        },
        
        isIPv4(value) {
            return CONFIG.formats.ipv4.test(String(value));
        },
        
        isIPv6(value) {
            return CONFIG.formats.ipv6.test(String(value));
        },
        
        isIP(value) {
            return this.isIPv4(value) || this.isIPv6(value);
        },
        
        isHexColor(value) {
            return CONFIG.formats.hex.test(String(value));
        },
        
        isRGBColor(value) {
            return /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.test(String(value));
        },
        
        isRGBAColor(value) {
            return /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/.test(String(value));
        },
        
        isHSLColor(value) {
            return /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/.test(String(value));
        },
        
        isUUID(value, version = null) {
            if (version) {
                const pattern = new RegExp(`^[0-9a-f]{8}-[0-9a-f]{4}-${version}[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`, 'i');
                return pattern.test(String(value));
            }
            return CONFIG.formats.uuid.test(String(value));
        },
        
        isBase64(value) {
            return CONFIG.formats.base64.test(String(value));
        },
        
        isJWT(value) {
            return CONFIG.formats.jwt.test(String(value));
        },
        
        isMD5(value) {
            return CONFIG.formats.md5.test(String(value));
        },
        
        isSHA1(value) {
            return CONFIG.formats.sha1.test(String(value));
        },
        
        isSHA256(value) {
            return CONFIG.formats.sha256.test(String(value));
        },
        
        isISBN(value, version = null) {
            const cleaned = String(value).replace(/[-\s]/g, '');
            
            if (version === 10) {
                return CONFIG.formats.isbn10.test(cleaned) && this.validateISBN10(cleaned);
            } else if (version === 13) {
                return CONFIG.formats.isbn13.test(cleaned) && this.validateISBN13(cleaned);
            }
            
            return (CONFIG.formats.isbn10.test(cleaned) && this.validateISBN10(cleaned)) || 
                   (CONFIG.formats.isbn13.test(cleaned) && this.validateISBN13(cleaned));
        },
        
        validateISBN10(isbn) {
            let sum = 0;
            for (let i = 0; i < 9; i++) {
                sum += (10 - i) * parseInt(isbn[i]);
            }
            const checksum = isbn[9] === 'X' ? 10 : parseInt(isbn[9]);
            return (sum + checksum) % 11 === 0;
        },
        
        validateISBN13(isbn) {
            let sum = 0;
            for (let i = 0; i < 12; i++) {
                sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
            }
            return (10 - (sum % 10)) % 10 === parseInt(isbn[12]);
        },
        
        isIBAN(value) {
            const cleaned = String(value).replace(/\s/g, '').toUpperCase();
            if (!CONFIG.formats.iban.test(cleaned)) return false;
            
            // Validation IBAN
            const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
            const numeric = rearranged.replace(/[A-Z]/g, char => char.charCodeAt(0) - 55);
            
            let remainder = numeric.slice(0, 9) % 97;
            for (let i = 9; i < numeric.length; i += 7) {
                remainder = (remainder + numeric.slice(i, i + 7)) % 97;
            }
            
            return remainder === 1;
        },
        
        isBIC(value) {
            return CONFIG.formats.bic.test(String(value).toUpperCase());
        },
        
        isMACAddress(value) {
            return CONFIG.formats.macAddress.test(String(value));
        },
        
        isDataURI(value) {
            return /^data:([a-z]+\/[a-z0-9-+.]+)?;?(charset=[a-z0-9-]+)?;?base64,/i.test(String(value));
        },
        
        isMimeType(value) {
            return /^(application|audio|font|example|image|message|model|multipart|text|video)\/[a-zA-Z0-9][a-zA-Z0-9\!\#\$\&\-\^\_\+\.]{0,126}$/i.test(String(value));
        },
        
        isLatLong(value) {
            return CONFIG.formats.coordinates.test(String(value));
        },
        
        isMongoId(value) {
            return /^[0-9a-fA-F]{24}$/.test(String(value));
        },
        
        isGitHubRepo(value) {
            return CONFIG.formats.githubRepo.test(String(value));
        },
        
        isTwitterHandle(value) {
            return CONFIG.formats.twitterHandle.test(String(value));
        },
        
        isVersion(value) {
            return CONFIG.formats.version.test(String(value));
        },
        
        isSemVer(value) {
            return CONFIG.formats.semver.test(String(value));
        }
    };
    
    // ========================================
    // VALIDATIONS DE FICHIERS
    // ========================================
    const FileValidators = {
        maxSize(file, maxSizeInBytes) {
            return file.size <= maxSizeInBytes;
        },
        
        minSize(file, minSizeInBytes) {
            return file.size >= minSizeInBytes;
        },
        
        fileType(file, allowedTypes) {
            const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
            return types.some(type => {
                if (type.includes('/')) {
                    // MIME type
                    return file.type === type;
                } else if (type.startsWith('.')) {
                    // Extension
                    return file.name.toLowerCase().endsWith(type.toLowerCase());
                } else {
                    // Category (image, video, etc.)
                    return file.type.startsWith(type + '/');
                }
            });
        },
        
        imageType(file) {
            return this.fileType(file, ['image']);
        },
        
        videoType(file) {
            return this.fileType(file, ['video']);
        },
        
        audioType(file) {
            return this.fileType(file, ['audio']);
        },
        
        documentType(file) {
            const docTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain'
            ];
            return this.fileType(file, docTypes);
        },
        
        async imageDimensions(file, width, height, operator = 'exact') {
            return new Promise((resolve) => {
                if (!file.type.startsWith('image/')) {
                    resolve(false);
                    return;
                }
                
                const img = new Image();
                const url = URL.createObjectURL(file);
                
                img.onload = function() {
                    URL.revokeObjectURL(url);
                    
                    switch (operator) {
                        case 'exact':
                            resolve(img.width === width && img.height === height);
                            break;
                        case 'min':
                            resolve(img.width >= width && img.height >= height);
                            break;
                        case 'max':
                            resolve(img.width <= width && img.height <= height);
                            break;
                        default:
                            resolve(false);
                    }
                };
                
                img.onerror = function() {
                    URL.revokeObjectURL(url);
                    resolve(false);
                };
                
                img.src = url;
            });
        },
        
        async imageAspectRatio(file, width, height, tolerance = 0.01) {
            return new Promise((resolve) => {
                if (!file.type.startsWith('image/')) {
                    resolve(false);
                    return;
                }
                
                const img = new Image();
                const url = URL.createObjectURL(file);
                
                img.onload = function() {
                    URL.revokeObjectURL(url);
                    const targetRatio = width / height;
                    const actualRatio = img.width / img.height;
                    resolve(Math.abs(targetRatio - actualRatio) <= tolerance);
                };
                
                img.onerror = function() {
                    URL.revokeObjectURL(url);
                    resolve(false);
                };
                
                img.src = url;
            });
        },
        
        fileCount(files, min, max = null) {
            const count = files.length;
            if (max !== null) {
                return count >= min && count <= max;
            }
            return count >= min;
        },
        
        totalSize(files, maxSizeInBytes) {
            const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
            return totalSize <= maxSizeInBytes;
        }
    };
    
    // ========================================
    // VALIDATIONS PERSONNALISÉES
    // ========================================
    const CustomValidators = {
        // Base de données des validateurs personnalisés
        validators: new Map(),
        
        // Ajouter un validateur personnalisé
        add(name, validator, message = null) {
            this.validators.set(name, {
                validator,
                message: message || CONFIG.messages[currentLocale].custom
            });
        },
        
        // Supprimer un validateur personnalisé
        remove(name) {
            this.validators.delete(name);
        },
        
        // Obtenir un validateur personnalisé
        get(name) {
            return this.validators.get(name);
        },
        
        // Exécuter un validateur personnalisé
        async execute(name, value, params = {}) {
            const custom = this.get(name);
            if (!custom) {
                throw new Error(`Validateur personnalisé "${name}" non trouvé`);
            }
            
            const result = await custom.validator(value, params);
            return {
                valid: result,
                message: typeof custom.message === 'function' ? custom.message(value, params) : custom.message
            };
        },
        
        // Validateurs personnalisés prédéfinis
        init() {
            // Validation d'unicité (nécessite une fonction de vérification)
            this.add('unique', async (value, { checkFunction }) => {
                if (!checkFunction) return true;
                return !(await checkFunction(value));
            }, 'Cette valeur existe déjà');
            
            // Validation de force de mot de passe personnalisée
            this.add('passwordStrength', (value, { minScore = 3 }) => {
                let score = 0;
                
                // Longueur
                if (value.length >= 8) score++;
                if (value.length >= 12) score++;
                if (value.length >= 16) score++;
                
                // Complexité
                if (/[a-z]/.test(value)) score++;
                if (/[A-Z]/.test(value)) score++;
                if (/[0-9]/.test(value)) score++;
                if (/[^a-zA-Z0-9]/.test(value)) score++;
                
                // Patterns
                if (!/(.)\1{2,}/.test(value)) score++; // Pas de répétitions
                if (!/^[0-9]+$/.test(value)) score++; // Pas que des chiffres
                if (!/^[a-zA-Z]+$/.test(value)) score++; // Pas que des lettres
                
                return score >= minScore;
            }, 'Le mot de passe n\'est pas assez fort');
            
            // Validation de numéro de sécurité sociale français
            this.add('numeroSecu', (value) => {
                const cleaned = String(value).replace(/\s/g, '');
                if (!/^[12]\d{2}(0[1-9]|1[0-2])\d{2}\d{3}\d{3}\d{2}$/.test(cleaned)) {
                    return false;
                }
                
                const number = cleaned.substring(0, 13);
                const key = parseInt(cleaned.substring(13, 15));
                const calculatedKey = 97 - (parseInt(number) % 97);
                
                return key === calculatedKey;
            }, 'Numéro de sécurité sociale invalide');
            
            // Validation de SIRET
            this.add('siret', (value) => {
                const cleaned = String(value).replace(/\s/g, '');
                if (!/^\d{14}$/.test(cleaned)) return false;
                
                let sum = 0;
                for (let i = 0; i < 14; i++) {
                    let digit = parseInt(cleaned[i]);
                    if (i % 2 === 1) {
                        digit *= 2;
                        if (digit > 9) digit -= 9;
                    }
                    sum += digit;
                }
                
                return sum % 10 === 0;
            }, 'Numéro SIRET invalide');
            
            // Validation de coordonnées bancaires (RIB)
            this.add('rib', (value) => {
                const cleaned = String(value).replace(/\s/g, '');
                if (!/^\d{5}\d{5}[A-Z0-9]{11}\d{2}$/.test(cleaned)) return false;
                
                // Algorithme de validation RIB
                const bank = cleaned.substring(0, 5);
                const branch = cleaned.substring(5, 10);
                const account = cleaned.substring(10, 21);
                const key = parseInt(cleaned.substring(21, 23));
                
                // Conversion des lettres en chiffres
                const accountNumeric = account.replace(/[A-Z]/g, (char) => {
                    return ((char.charCodeAt(0) - 65) % 9) + 1;
                });
                
                const calculatedKey = 97 - ((parseInt(bank) * 89 + parseInt(branch) * 15 + parseInt(accountNumeric) * 3) % 97);
                
                return key === calculatedKey;
            }, 'RIB invalide');
        }
    };
    
    // ========================================
    // VALIDATIONS COMPOSÉES
    // ========================================
    const CompositeValidators = {
        // Validation avec conditions multiples
        all(...validators) {
            return async (value) => {
                for (const validator of validators) {
                    const result = await validator(value);
                    if (!result) return false;
                }
                return true;
            };
        },
        
        // Au moins une validation doit passer
        any(...validators) {
            return async (value) => {
                for (const validator of validators) {
                    const result = await validator(value);
                    if (result) return true;
                }
                return false;
            };
        },
        
        // Validation conditionnelle
        when(condition, thenValidator, elseValidator = null) {
            return async (value, context = {}) => {
                const shouldValidate = typeof condition === 'function' ? 
                    await condition(value, context) : condition;
                
                if (shouldValidate) {
                    return await thenValidator(value, context);
                } else if (elseValidator) {
                    return await elseValidator(value, context);
                }
                return true;
            };
        },
        
        // Validation avec transformation
        transform(transformer, validator) {
            return async (value) => {
                const transformed = await transformer(value);
                return await validator(transformed);
            };
        },
        
        // Validation de champs dépendants
        dependent(fieldName, validator) {
            return async (value, context = {}) => {
                const dependentValue = context[fieldName];
                return await validator(value, dependentValue, context);
            };
        },
        
        // Validation avec retry
        retry(validator, attempts = 3, delay = 1000) {
            return async (value) => {
                for (let i = 0; i < attempts; i++) {
                    try {
                        const result = await validator(value);
                        if (result) return true;
                    } catch (error) {
                        if (i === attempts - 1) throw error;
                    }
                    
                    if (i < attempts - 1) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
                return false;
            };
        },
        
        // Validation avec cache
        cached(validator, ttl = 60000) {
            const cache = new Map();
            
            return async (value) => {
                const key = JSON.stringify(value);
                const cached = cache.get(key);
                
                if (cached && Date.now() - cached.timestamp < ttl) {
                    return cached.result;
                }
                
                const result = await validator(value);
                cache.set(key, { result, timestamp: Date.now() });
                
                // Nettoyer le cache
                if (cache.size > 1000) {
                    const oldestKey = cache.keys().next().value;
                    cache.delete(oldestKey);
                }
                
                return result;
            };
        },
        
        // Validation avec debounce
        debounced(validator, delay = 300) {
            let timeoutId;
            
            return (value) => {
                return new Promise((resolve) => {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(async () => {
                        const result = await validator(value);
                        resolve(result);
                    }, delay);
                });
            };
        }
    };
    
    // ========================================
    // VALIDATEUR PRINCIPAL
    // ========================================
    class Validator {
        constructor(rules = {}, options = {}) {
            this.rules = rules;
            this.options = { ...CONFIG, ...options };
            this.errors = {};
            this.values = {};
        }
        
        // Valider une seule valeur
        async validateField(fieldName, value, rules = null) {
            const fieldRules = rules || this.rules[fieldName];
            if (!fieldRules) return { valid: true };
            
            const errors = [];
            const rulesList = Array.isArray(fieldRules) ? fieldRules : [fieldRules];
            
            for (const rule of rulesList) {
                const result = await this.executeRule(rule, value, fieldName);
                if (!result.valid) {
                    errors.push(result.message);
                    if (!this.options.showMultipleErrors) break;
                }
            }
            
            return {
                valid: errors.length === 0,
                errors
            };
        }
        
        // Exécuter une règle de validation
        async executeRule(rule, value, fieldName) {
            // Règle sous forme de fonction
            if (typeof rule === 'function') {
                const result = await rule(value, this.values);
                return {
                    valid: result,
                    message: this.getMessage('custom', { field: fieldName })
                };
            }
            
            // Règle sous forme d'objet
            if (typeof rule === 'object' && rule.validator) {
                const result = await rule.validator(value, this.values);
                return {
                    valid: result,
                    message: rule.message || this.getMessage('custom', { field: fieldName })
                };
            }
            
            // Règle sous forme de string (nom de règle prédéfinie)
            if (typeof rule === 'string') {
                return await this.executePredefinedRule(rule, value, fieldName);
            }
            
            // Règle avec paramètres
            if (typeof rule === 'object') {
                const ruleName = Object.keys(rule)[0];
                const params = rule[ruleName];
                return await this.executePredefinedRule(ruleName, value, fieldName, params);
            }
            
            return { valid: true };
        }
        
        // Exécuter une règle prédéfinie
        async executePredefinedRule(ruleName, value, fieldName, params = null) {
            const messages = CONFIG.messages[currentLocale];
            
            switch (ruleName) {
                // Règles de base
                case 'required':
                    return {
                        valid: !TypeValidators.isEmpty(value),
                        message: messages.required
                    };
                
                // Règles de type
                case 'string':
                    return {
                        valid: TypeValidators.isString(value),
                        message: 'Ce champ doit être une chaîne de caractères'
                    };
                
                case 'number':
                    return {
                        valid: TypeValidators.isNumber(value),
                        message: 'Ce champ doit être un nombre'
                    };
                
                case 'boolean':
                    return {
                        valid: TypeValidators.isBoolean(value),
                        message: 'Ce champ doit être un booléen'
                    };
                
                case 'array':
                    return {
                        valid: TypeValidators.isArray(value),
                        message: 'Ce champ doit être un tableau'
                    };
                
                case 'object':
                    return {
                        valid: TypeValidators.isObject(value),
                        message: 'Ce champ doit être un objet'
                    };
                
                case 'date':
                    return {
                        valid: DateValidators.isValidDate(value),
                        message: messages.date
                    };
                
                // Règles de chaînes
                case 'minLength':
                    return {
                        valid: StringValidators.minLength(value, params),
                        message: messages.minLength.replace('{min}', params)
                    };
                
                case 'maxLength':
                    return {
                        valid: StringValidators.maxLength(value, params),
                        message: messages.maxLength.replace('{max}', params)
                    };
                
                case 'exactLength':
                    return {
                        valid: StringValidators.exactLength(value, params),
                        message: messages.exactLength.replace('{length}', params)
                    };
                
                case 'email':
                    return {
                        valid: FormatValidators.isEmail(value, params?.strict),
                        message: messages.email
                    };
                
                case 'url':
                    return {
                        valid: FormatValidators.isURL(value, params?.strict),
                        message: messages.url
                    };
                
                case 'phone':
                    return {
                        valid: FormatValidators.isPhone(value, params?.country),
                        message: messages.phone
                    };
                
                case 'alphanumeric':
                    return {
                        valid: StringValidators.isAlphanumeric(value),
                        message: messages.alphanumeric
                    };
                
                case 'alphabetic':
                    return {
                        valid: StringValidators.isAlphabetic(value),
                        message: messages.alphabetic
                    };
                
                case 'numeric':
                    return {
                        valid: StringValidators.isNumeric(value),
                        message: messages.numeric
                    };
                
                // Règles de nombres
                case 'min':
                    return {
                        valid: NumberValidators.min(value, params),
                        message: messages.minValue.replace('{min}', params)
                    };
                
                case 'max':
                    return {
                        valid: NumberValidators.max(value, params),
                        message: messages.maxValue.replace('{max}', params)
                    };
                
                case 'between':
                    return {
                        valid: NumberValidators.between(value, params.min, params.max),
                        message: messages.between.replace('{min}', params.min).replace('{max}', params.max)
                    };
                
                case 'integer':
                    return {
                        valid: TypeValidators.isInteger(value),
                        message: messages.integer
                    };
                
                case 'decimal':
                    return {
                        valid: CONFIG.formats.decimal.test(String(value)),
                        message: messages.decimal
                    };
                
                // Règles de dates
                case 'dateBefore':
                    return {
                        valid: DateValidators.isBefore(value, params),
                        message: messages.dateBefore.replace('{date}', params)
                    };
                
                case 'dateAfter':
                    return {
                        valid: DateValidators.isAfter(value, params),
                        message: messages.dateAfter.replace('{date}', params)
                    };
                
                case 'dateBetween':
                    return {
                        valid: DateValidators.isBetween(value, params.start, params.end),
                        message: messages.dateBetween.replace('{startDate}', params.start).replace('{endDate}', params.end)
                    };
                
                // Règles de formats
                case 'creditCard':
                    return {
                        valid: FormatValidators.isCreditCard(value),
                        message: messages.creditCard
                    };
                
                case 'cvv':
                    return {
                        valid: FormatValidators.isCVV(value),
                        message: messages.cvv
                    };
                
                case 'postalCode':
                    return {
                        valid: FormatValidators.isPostalCode(value, params?.country),
                        message: messages.postalCode
                    };
                
                case 'ipAddress':
                    return {
                        valid: FormatValidators.isIP(value),
                        message: messages.ipAddress
                    };
                
                case 'macAddress':
                    return {
                        valid: FormatValidators.isMACAddress(value),
                        message: messages.macAddress
                    };
                
                case 'uuid':
                    return {
                        valid: FormatValidators.isUUID(value, params?.version),
                        message: messages.uuid
                    };
                
                case 'iban':
                    return {
                        valid: FormatValidators.isIBAN(value),
                        message: messages.iban
                    };
                
                case 'bic':
                    return {
                        valid: FormatValidators.isBIC(value),
                        message: messages.bic
                    };
                
                case 'hexColor':
                    return {
                        valid: FormatValidators.isHexColor(value),
                        message: messages.hexColor
                    };
                
                case 'base64':
                    return {
                        valid: FormatValidators.isBase64(value),
                        message: messages.base64
                    };
                
                case 'json':
                    try {
                        JSON.parse(value);
                        return { valid: true };
                    } catch {
                        return { valid: false, message: messages.json };
                    }
                
                case 'username':
                    return {
                        valid: CONFIG.formats.username.test(String(value)),
                        message: messages.username
                    };
                
                case 'password':
                    return {
                        valid: CONFIG.formats.password.test(String(value)),
                        message: messages.password
                    };
                
                case 'passwordStrong':
                    return {
                        valid: CONFIG.formats.passwordStrong.test(String(value)),
                        message: messages.passwordStrong
                    };
                
                case 'slug':
                    return {
                        valid: StringValidators.isSlug(value),
                        message: messages.slug
                    };
                
                case 'coordinates':
                    return {
                        valid: CONFIG.formats.coordinates.test(String(value)),
                        message: messages.coordinates
                    };
                
                // Règles personnalisées
                case 'custom':
                    if (params && params.name) {
                        return await CustomValidators.execute(params.name, value, params);
                    }
                    return { valid: false, message: messages.custom };
                
                // Règle de pattern
                case 'pattern':
                case 'matches':
                    return {
                        valid: StringValidators.matches(value, params),
                        message: messages.pattern
                    };
                
                default:
                    // Vérifier si c'est un validateur personnalisé
                    const custom = CustomValidators.get(ruleName);
                    if (custom) {
                        return await CustomValidators.execute(ruleName, value, params);
                    }
                    
                    return { valid: true };
            }
        }
        
        // Valider tous les champs
        async validate(data) {
            this.values = data;
            this.errors = {};
            const results = {};
            
            for (const fieldName in this.rules) {
                const value = data[fieldName];
                const result = await this.validateField(fieldName, value);
                
                if (!result.valid) {
                    this.errors[fieldName] = result.errors;
                }
                
                results[fieldName] = result;
            }
            
            return {
                valid: Object.keys(this.errors).length === 0,
                errors: this.errors,
                results
            };
        }
        
        // Obtenir le message d'erreur
        getMessage(rule, params = {}) {
            const messages = CONFIG.messages[currentLocale];
            let message = messages[rule] || messages.custom;
            
            // Remplacer les paramètres dans le message
            Object.keys(params).forEach(key => {
                message = message.replace(`{${key}}`, params[key]);
            });
            
            return message;
        }
        
        // Ajouter une règle
        addRule(fieldName, rule) {
            if (!this.rules[fieldName]) {
                this.rules[fieldName] = [];
            } else if (!Array.isArray(this.rules[fieldName])) {
                this.rules[fieldName] = [this.rules[fieldName]];
            }
            
            this.rules[fieldName].push(rule);
        }
        
        // Supprimer une règle
        removeRule(fieldName, ruleName = null) {
            if (!ruleName) {
                delete this.rules[fieldName];
            } else if (Array.isArray(this.rules[fieldName])) {
                this.rules[fieldName] = this.rules[fieldName].filter(rule => {
                    if (typeof rule === 'string') return rule !== ruleName;
                    if (typeof rule === 'object' && !rule.validator) {
                        return !Object.keys(rule).includes(ruleName);
                    }
                    return true;
                });
            }
        }
        
        // Réinitialiser les erreurs
        clearErrors() {
            this.errors = {};
        }
    }
    
    // ========================================
    // HELPERS ET UTILITAIRES
    // ========================================
    const Helpers = {
        // Créer un schéma de validation
        schema(definition) {
            return new Validator(definition);
        },
        
        // Valider une valeur unique
        async validate(value, rules) {
            const validator = new Validator({ field: rules });
            const result = await validator.validateField('field', value);
            return result;
        },
        
        // Créer un validateur de formulaire
        form(formElement, rules, options = {}) {
            const validator = new Validator(rules, options);
            
            // Attacher les événements
            const inputs = formElement.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                const fieldName = input.name;
                if (!fieldName || !rules[fieldName]) return;
                
                // Validation sur blur
                if (options.validateOnBlur !== false) {
                    input.addEventListener('blur', async () => {
                        const result = await validator.validateField(fieldName, input.value);
                        this.updateFieldUI(input, result);
                    });
                }
                
                // Validation sur change
                if (options.validateOnChange) {
                    input.addEventListener('input', async () => {
                        const result = await validator.validateField(fieldName, input.value);
                        this.updateFieldUI(input, result);
                    });
                }
            });
            
            // Validation sur submit
            formElement.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(formElement);
                const data = Object.fromEntries(formData);
                
                const result = await validator.validate(data);
                
                if (result.valid) {
                    if (options.onSuccess) {
                        options.onSuccess(data);
                    }
                } else {
                    if (options.onError) {
                        options.onError(result.errors);
                    }
                    
                    // Mettre à jour l'UI
                    for (const fieldName in result.results) {
                        const input = formElement.querySelector(`[name="${fieldName}"]`);
                        if (input) {
                            this.updateFieldUI(input, result.results[fieldName]);
                        }
                    }
                }
            });
            
            return validator;
        },
        
        // Mettre à jour l'UI d'un champ
        updateFieldUI(input, result) {
            const errorClass = CONFIG.customErrorClass;
            const successClass = CONFIG.customSuccessClass;
            
            // Retirer les classes existantes
            input.classList.remove(errorClass, successClass);
            
            // Trouver ou créer l'élément d'erreur
            let errorElement = input.parentElement.querySelector('.validation-message');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'validation-message';
                input.parentElement.appendChild(errorElement);
            }
            
            if (result.valid) {
                input.classList.add(successClass);
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            } else {
                input.classList.add(errorClass);
                errorElement.textContent = result.errors.join(', ');
                errorElement.style.display = 'block';
            }
        },
        
        // Convertir des règles de validation HTML5 en règles du système
        fromHTML5(input) {
            const rules = [];
            
            if (input.required) rules.push('required');
            if (input.type === 'email') rules.push('email');
            if (input.type === 'url') rules.push('url');
            if (input.type === 'number') {
                rules.push('number');
                if (input.min !== '') rules.push({ min: Number(input.min) });
                if (input.max !== '') rules.push({ max: Number(input.max) });
            }
            if (input.minLength > 0) rules.push({ minLength: input.minLength });
            if (input.maxLength > 0) rules.push({ maxLength: input.maxLength });
            if (input.pattern) rules.push({ pattern: input.pattern });
            
            return rules;
        },
        
        // Sanitizer les données
        sanitize: {
            trim(value) {
                return String(value).trim();
            },
            
            lowercase(value) {
                return String(value).toLowerCase();
            },
            
            uppercase(value) {
                return String(value).toUpperCase();
            },
            
            capitalize(value) {
                return String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
            },
            
            removeSpaces(value) {
                return String(value).replace(/\s/g, '');
            },
            
            removeSpecialChars(value) {
                return String(value).replace(/[^a-zA-Z0-9]/g, '');
            },
            
            escapeHTML(value) {
                const div = document.createElement('div');
                div.textContent = value;
                return div.innerHTML;
            },
            
            unescapeHTML(value) {
                const div = document.createElement('div');
                div.innerHTML = value;
                return div.textContent;
            },
            
            toNumber(value) {
                return Number(value);
            },
            
            toBoolean(value) {
                return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
            },
            
            toDate(value) {
                return new Date(value);
            },
            
            normalizeEmail(value) {
                return String(value).toLowerCase().trim();
            },
            
            normalizePhone(value) {
                return String(value).replace(/[^\d+]/g, '');
            }
        }
    };
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    // Initialiser les validateurs personnalisés
    CustomValidators.init();
    
    return {
        // Configuration
        config: CONFIG,
        setLocale(locale) {
            if (CONFIG.messages[locale]) {
                currentLocale = locale;
            }
        },
        
        // Validateurs
        types: TypeValidators,
        strings: StringValidators,
        numbers: NumberValidators,
        dates: DateValidators,
        formats: FormatValidators,
        files: FileValidators,
        custom: CustomValidators,
        composite: CompositeValidators,
        
        // Classe Validator
        Validator,
        
        // Helpers
        ...Helpers,
        
        // Méthodes de validation rapide
        isRequired: (value) => !TypeValidators.isEmpty(value),
        isEmail: FormatValidators.isEmail,
        isURL: FormatValidators.isURL,
        isPhone: FormatValidators.isPhone,
        isCreditCard: FormatValidators.isCreditCard,
        isDate: DateValidators.isValidDate,
        isNumber: TypeValidators.isNumber,
        isString: TypeValidators.isString,
        isArray: TypeValidators.isArray,
        isObject: TypeValidators.isObject,
        
        // Créer un validateur personnalisé
        create(name, validator, message) {
            CustomValidators.add(name, validator, message);
        },
        
        // Messages d'erreur
        messages: CONFIG.messages,
        
        // Formats regex
        patterns: CONFIG.formats
    };
})();

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationUtils;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2025-01-28] - Architecture modulaire
   Solution: Séparation en catégories logiques de validateurs
   
   [2025-01-28] - Support asynchrone
   Solution: Utilisation de async/await pour toutes les validations
   
   [2025-01-28] - Messages multilingues
   Solution: Système de messages avec placeholders
   
   [2025-01-28] - Validations composées
   Solution: Système de composition flexible avec when, all, any
   
   NOTES POUR REPRISES FUTURES:
   - Toutes les validations supportent l'asynchrone
   - Les messages sont personnalisables par locale
   - Support complet des validations de fichiers
   - Extensible via validateurs personnalisés
   ======================================== */