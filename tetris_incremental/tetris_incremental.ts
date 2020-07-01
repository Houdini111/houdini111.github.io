function greeter(person: string) {
    return "Hello, " + person;
}

let user :string = "Alex Fenton!";

let span = document.createElement("span");
span.innerText = greeter(user);
document.body.appendChild(span);