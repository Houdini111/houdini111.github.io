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

    updateResources(resources, save_data) {
        if (resources == null) {
            return;
        }
        if (!Array.isArray(resources)) {
            resources = [resources];
        }
        for (let resource of resources) {
            let mappingForResource = this.mappings.get(resource);
            if (mappingForResource == null) {
                continue;
            }
            let valueForResource = save_data.getResourceFromPath(resource);
            for (let mappedClass of mappingForResource.elementClasses) {
                set_all_for_class(mappedClass, valueForResource);
            }
        }
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
}