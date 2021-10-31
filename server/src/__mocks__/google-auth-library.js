const googleAuth = jest.createMockFromModule("google-auth-library");

googleAuth.OAuth2Client = function () {
  const obj = {};
  obj.verifyIdToken = function () {
    return Promise.resolve({
      getPayload: () => ({
        name: "user",
        picture: "http://picture.com/123",
        email: "user@gmail.com",
      }),
    });
  };
  return obj;
};

module.exports = googleAuth;
