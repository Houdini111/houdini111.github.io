class ResourceUpdater {
    mappings;

    constructor() {
        this.mappings = new Map();
    }

    addMapping(resourcePath, elementClass) {
        let resourceMapping = this.mappings.get(resourcePath);
        if (resourceMapping == null) {
            resourceMapping = new ResourceMapping(resourcePath, elementClass);
            this.mappings.set(resourcePath, resourceMapping);
        } else {
            resourceMapping.addClassToMapping(elementClass);
        }
    }

    updateAllResources(save_data) {
        for (let [path, mapping] of this.mappings) {
            let valueForResource = save_data.getResourceFromPath(mapping.resourcePath);
            mapping.updateValues(valueForResource);
        }
    }

    updateResources(resources, save_data) {
        if (resources == null) {
            return;
        }
        if (!Array.isArray(resources)) {
            updateResource(resources, save_data);
        }
        for (let resource of resources) {
            this.updateResource(resource, save_data);
        }
    }

    updateResource(resource, save_data) {
        let mappingForResource = this.mappings.get(resource);
        if (mappingForResource == null) {
            return;
        }
        let valueForResource = save_data.getResourceFromPath(resource);
        mappingForResource.updateValues(valueForResource);
    }
}

class ResourceMapping {
    resourcePath;
    elementClasses;

    constructor(resourcePath, elementClasses) {
        this.resourcePath = resourcePath;
        if (!Array.isArray(elementClasses)) {
            elementClasses = [elementClasses];
        }
        this.elementClasses = elementClasses;
    }

    addClassToMapping(elementClass) {
        this.elementClasses.push(elementClass);
    }

    updateValues(value) {
        for (let mappedClass of this.elementClasses) {
            set_all_for_class(mappedClass, value);
        }
    }
}