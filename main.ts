// 1

interface BaseContent {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    status: 'draft' | 'published' | 'archived';
}

interface Article extends BaseContent {
    title: string;
    content: string;
    authorId: string;
    tags?: string[];
}

interface Product extends BaseContent {
    name: string;
    description: string;
    price: number;
}

type ContentOperations<T extends BaseContent> = {
    create: (content: T) => boolean;
    read: (id: string) => T;
    update: (id: string, content: T) => boolean;
    delete: (id: string) => boolean;
}

// 2

const currentUserId = 'user';

type Role = 'admin' | 'editor' | 'viewer';

type Permission = {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
}

type AccessControl<T extends BaseContent> = {
    [role in Role]: {
        [operation in keyof Permission]: (content: T) => boolean;
    };
}

const articleAccessControl: AccessControl<Article> = {
    admin: {
        create: () => true,
        read: () => true,
        update: () => true,
        delete: () => true,
    },
    editor: {
        create: () => true,
        read: () => true,
        update: (article) => article.authorId === currentUserId,
        delete: () => false,
    },
    viewer: {
        create: () => false,
        read: (article) => article.status === 'published',
        update: () => false,
        delete: () => false,
    },
};

const productAccessControl: AccessControl<Article> = {
    admin: {
        create: () => true,
        read: () => true,
        update: () => true,
        delete: () => true,
    },
    editor: {
        create: () => true,
        read: () => true,
        update: () => true,
        delete: () => false,
    },
    viewer: {
        create: () => false,
        read: () => true,
        update: () => false,
        delete: () => false,
    },
};

// 3
type Validator<T> = {
    validate: (data: T) => ValidationResult;
}

type ValidationResult = {
    isValid: boolean;
    errors?: string[];
}

class ArticleValidator implements Validator<Article> {
    validate(data: Article): ValidationResult {
        const errors: string[] = [];
        if (!data.title || data.title.trim() === '') {
            errors.push('Заголовок обов’язковий.');
        }
        if (!data.content || data.content.trim() === '') {
            errors.push('Контент обов’язковий.');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

class ProductValidator implements Validator<Product> {
    validate(data: Product): ValidationResult {
        const errors: string[] = [];
        if (!data.name || data.name.trim() === '') {
            errors.push('Назва обов’язкова.');
        }
        if (data.price === undefined || data.price <= 0) {
            errors.push('Ціна повинна бути більшою за 0.');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

class CompositeValidator {
    private validators: { [key: string]: Validator<any> } = {};

    register<T extends BaseContent>(typeName: string, validator: Validator<T>) {
        this.validators[typeName] = validator;
    }

    validate<T extends BaseContent>(typeName: string, data: T): ValidationResult {
        const validator = this.validators[typeName];
        if (validator) {
            return validator.validate(data);
        }
        return { isValid: true };
    }
}

// 4

interface Versioning<T extends BaseContent> {
    version: number;
    previousVersions: T[];
    saveVersion: () => void;
    getVersion: (versionNumber: number) => T | undefined;
}

interface Versioned<T extends BaseContent> extends Versioning<T> {
    content: T;
}

class VersionedContent<T extends BaseContent> implements Versioned<T> {
    content: T;
    version: number = 1;
    previousVersions: T[] = [];

    constructor(content: T) {
        this.content = content;
    }

    saveVersion() {
        const contentCopy = { ...this.content };
        this.previousVersions.push(contentCopy);
        this.version++;
    }

    getVersion(versionNumber: number): T | undefined {
        return this.previousVersions[versionNumber - 1];
    }
}
