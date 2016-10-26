module.exports = [
        {
        method: 'POST',
        path: '/device',
        handler: { act: 'role:restRequest, cmd:registerDevice' } // will hit the registerDevice pattern using funky jsonic syntax
    }
];